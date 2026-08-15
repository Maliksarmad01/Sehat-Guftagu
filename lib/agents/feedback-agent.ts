/**
 * Feedback Agent
 * Agent 5: Handles doctor review, accept/reject, and report regeneration
 *
 * Flow:
 * 1. Receive doctor's review action (approve/reject/request_changes)
 * 2. If rejected, regenerate report with feedback
 * 3. Update review status in database
 * 4. Record doctor's prescription and notes
 * 5. Feedback loop continues until doctor accepts
 */

import { StateGraph } from '@langchain/langgraph';
import type { FeedbackAgentState, SOAPReport, ReviewStatus } from './types';
import { FeedbackAgentStateSchema } from './types';
import { regenerateSOAPWithFeedback } from './llm-utils';
import prisma from '@/lib/prisma';

/**
 * Node: Process doctor's review action
 */
async function processReviewAction(state: FeedbackAgentState) {
  console.log('\n👨‍⚕️ [Feedback Agent] Processing doctor review...');
  console.log(`   📋 Report ID: ${state.reportId}`);
  console.log(`   ✍️ Action: ${state.reviewAction}`);
  console.log(`   ⭐ Rating: ${state.starRating}/5`);

  let needsRegeneration = false;
  let finalStatus: ReviewStatus = 'pending';

  switch (state.reviewAction) {
    case 'approve':
      finalStatus = 'approved';
      console.log('   ✅ Report APPROVED');
      break;
    case 'reject':
      finalStatus = 'rejected';
      needsRegeneration = true;
      console.log('   ❌ Report REJECTED - will regenerate');
      break;
    case 'request_changes':
      finalStatus = 'in_review';
      // FIX: Always regenerate if changes are requested, regardless of rating
      // The user explicitly asked for changes/regeneration
      needsRegeneration = true;
      console.log(`   🔄 Changes requested - will regenerate with feedback`);
      break;
  }

  return {
    needsRegeneration,
    finalStatus,
  };
}

/**
 * Node: Regenerate report based on doctor feedback
 */
async function regenerateReport(state: FeedbackAgentState) {
  console.log('\n🔄 [Feedback Agent] Regenerating report with feedback...');

  if (!state.needsRegeneration) {
    console.log('   ⏭️ Regeneration not needed');
    return { regeneratedReport: null };
  }

  try {
    // Fetch original report from database
    const originalReport = await prisma.sOAPReport.findUnique({
      where: { id: state.reportId },
      include: {
        session: {
          select: {
            conversationLog: true,
            identifiedSymptoms: true,
            differentialDiagnosis: true,
          },
        },
      },
    });

    if (!originalReport) {
      console.log('   ❌ Original report not found');
      return { regeneratedReport: null };
    }

    // Use LLM to regenerate with feedback
    const regeneratedData = await regenerateSOAPWithFeedback({
      originalReport: {
        subjective: originalReport.subjective,
        objective: originalReport.objective,
        assessment: originalReport.assessment,
        plan: originalReport.plan,
      },
      doctorFeedback: state.doctorFeedback,
      rejectionReason: state.rejectionReason,
    });

    // Construct new SOAP report
    const regeneratedReport: SOAPReport = {
      subjective: regeneratedData.subjective || originalReport.subjective,
      objective: regeneratedData.objective || originalReport.objective,
      assessment: {
        ...(regeneratedData.assessment || originalReport.assessment),
        redFlags: (originalReport.assessment as any)?.redFlags || [],
      },
      plan: regeneratedData.plan || originalReport.plan,
      metadata: {
        generatedAt: new Date().toISOString(),
        sessionId: originalReport.sessionId,
        patientId: originalReport.patientId,
        department: originalReport.department || undefined,
        triageLabel: 'standard',
        aiVersion: 'sehat-guftagu-v2.0-regenerated',
      },
    };

    console.log('   ✅ Report regenerated with doctor feedback');
    return { regeneratedReport };
  } catch (error) {
    console.error('   ❌ Report regeneration failed:', error);
    return { regeneratedReport: null };
  }
}

/**
 * Node: Update database with review status
 */
async function updateReviewInDb(state: FeedbackAgentState) {
  console.log('\n💾 [Feedback Agent] Updating review in database...');

  try {
    const updateData: any = {
      reviewStatus: state.finalStatus,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    };

    // Add doctor's notes if provided
    if (state.doctorNotes) {
      updateData.doctorNotes = state.doctorNotes;
    }

    // Add prescription if approved
    if (state.prescription && state.finalStatus === 'approved') {
      updateData.prescription = state.prescription;
    }

    // Add doctor ID
    if (state.doctorId) {
      updateData.assignedDoctorId = state.doctorId;
    }

    // If regenerated, update the report content
    if (state.regeneratedReport && state.needsRegeneration) {
      updateData.subjective = state.regeneratedReport.subjective;
      updateData.objective = state.regeneratedReport.objective;
      updateData.assessment = state.regeneratedReport.assessment;
      updateData.plan = state.regeneratedReport.plan;
      // Reset to pending for re-review after regeneration
      updateData.reviewStatus = 'pending';
    }

    await prisma.sOAPReport.update({
      where: { id: state.reportId },
      data: updateData,
    });

    console.log(`   ✅ Report updated - Status: ${updateData.reviewStatus}`);
    return { updatedInDb: true };
  } catch (error) {
    console.error('   ❌ Database update failed:', error);
    return { updatedInDb: false };
  }
}

/**
 * Node: Record feedback metrics for AI improvement
 */
async function recordFeedbackMetrics(state: FeedbackAgentState) {
  console.log('\n📊 [Feedback Agent] Recording feedback metrics...');

  // Log feedback for future AI training/improvement
  const metrics = {
    reportId: state.reportId,
    doctorId: state.doctorId,
    action: state.reviewAction,
    rating: state.starRating,
    wasRegenerated: state.needsRegeneration,
    feedback: state.doctorFeedback,
    timestamp: new Date().toISOString(),
  };

  console.log(`   📈 Metrics recorded:`, metrics);

  // In a production system, you might want to:
  // - Store in a feedback analytics table
  // - Send to a monitoring system
  // - Use for model fine-tuning

  return {};
}

/**
 * Conditional: Check if regeneration was successful
 */
function checkRegenerationSuccess(
  state: FeedbackAgentState
): 'success' | 'update' {
  if (state.needsRegeneration && !state.regeneratedReport) {
    // Regeneration was needed but failed - still update with partial status
    return 'update';
  }
  return 'update'; // Always proceed to update
}

/**
 * Build the Feedback Agent Graph
 */
export function createFeedbackAgent() {
  const workflow = new StateGraph(FeedbackAgentStateSchema)
    .addNode('process_review', processReviewAction)
    .addNode('regenerate_report', regenerateReport)
    .addNode('update_db', updateReviewInDb)
    .addNode('record_metrics', recordFeedbackMetrics)
    .addEdge('__start__', 'process_review')
    .addEdge('process_review', 'regenerate_report')
    .addConditionalEdges('regenerate_report', checkRegenerationSuccess, {
      success: 'update_db',
      update: 'update_db',
    })
    .addEdge('update_db', 'record_metrics')
    .addEdge('record_metrics', '__end__');

  return workflow.compile();
}

/**
 * Process doctor's review of a SOAP report
 */
export async function processDoctorReview(params: {
  reportId: string;
  doctorId: string;
  action: 'approve' | 'reject' | 'request_changes';
  feedback?: string;
  starRating?: number;
  rejectionReason?: string;
  prescription?: string;
  doctorNotes?: string;
}): Promise<{
  finalStatus: ReviewStatus;
  needsRegeneration: boolean;
  regeneratedReport: SOAPReport | null;
  updatedInDb: boolean;
}> {
  const agent = createFeedbackAgent();

  const result = await agent.invoke({
    reportId: params.reportId,
    doctorId: params.doctorId,
    reviewAction: params.action,
    doctorFeedback: params.feedback || '',
    starRating: params.starRating || 5,
    rejectionReason: params.rejectionReason || '',
    suggestedCorrections: [],
    needsRegeneration: false,
    regeneratedReport: null,
    finalStatus: 'pending' as ReviewStatus,
    prescription: params.prescription || '',
    doctorNotes: params.doctorNotes || '',
    updatedInDb: false,
  });

  return {
    finalStatus: result.finalStatus,
    needsRegeneration: result.needsRegeneration,
    regeneratedReport: result.regeneratedReport,
    updatedInDb: result.updatedInDb,
  };
}

/**
 * Get pending reports for a doctor's department
 */
export async function getPendingReportsForDoctor(
  doctorId: string
): Promise<any[]> {
  try {
    console.log('\n📋 [Feedback Agent] Fetching pending reports...');
    console.log('   Doctor ID:', doctorId);

    // Fetch pending reports - show all pending if no department filter
    // Only filter by department if explicitly set, otherwise show all pending
    const whereClause: any = {
      reviewStatus: { in: ['pending', 'in_review'] },
      // Only show reports not yet assigned to another doctor, or assigned to this doctor
      OR: [{ assignedDoctorId: null }, { assignedDoctorId: doctorId }],
    };

    // Only filter by department if doctor has a specific department AND we want strict filtering
    // For now, doctors can see all pending reports regardless of department
    // Uncomment below to enable department filtering:
    // if (department) {
    //   whereClause.department = department;
    // }

    const reports = await prisma.sOAPReport.findMany({
      where: whereClause,
      include: {
        session: {
          select: {
            chiefComplaint: true,
            createdAt: true,
            patient: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { priority: 'asc' }, // urgent first
        { createdAt: 'desc' },
      ],
    });

    console.log(`   ✅ Found ${reports.length} pending reports`);

    // Format reports for API response
    const formattedReports = reports.map((report: any) => ({
      id: report.id,
      sessionId: report.sessionId,
      patientId: report.patient?.id || report.session?.patient?.id,
      patientName:
        report.patient?.name ||
        report.session?.patient?.name ||
        'Anonymous Patient',
      patientEmail: report.patient?.email || report.session?.patient?.email,
      chiefComplaint: report.session?.chiefComplaint || 'Clinical Interview',
      department: report.department || 'general',
      priority: report.priority,
      triageLabel: report.triageLabel || 'routine',
      reviewStatus: report.reviewStatus,
      subjective: report.subjective,
      objective: report.objective,
      assessment: report.assessment,
      plan: report.plan,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    }));

    return formattedReports;
  } catch (error) {
    console.error('❌ Failed to fetch pending reports:', error);
    return [];
  }
}

/**
 * Get review statistics for a doctor
 */
export async function getDoctorReviewStats(doctorId: string): Promise<{
  totalReviewed: number;
  approved: number;
  rejected: number;
  averageRating: number;
}> {
  try {
    const reports = await prisma.sOAPReport.findMany({
      where: {
        assignedDoctorId: doctorId,
      },
      select: {
        reviewStatus: true,
      },
    });

    const approved = reports.filter(r => r.reviewStatus === 'approved').length;
    const rejected = reports.filter(r => r.reviewStatus === 'rejected').length;

    return {
      totalReviewed: reports.length,
      approved,
      rejected,
      averageRating: 0, // Would need a separate ratings table for accurate tracking
    };
  } catch (error) {
    console.error('Failed to get review stats:', error);
    return {
      totalReviewed: 0,
      approved: 0,
      rejected: 0,
      averageRating: 0,
    };
  }
}
