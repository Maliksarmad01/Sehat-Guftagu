/**
 * Documentation Agent
 * Agent 3: Generates SOAP reports when clinical interview completes
 *
 * Flow:
 * 1. Collect all conversation data
 * 2. Generate SOAP report structure
 * 3. Determine department assignment
 * 4. Save report to Supabase
 * 5. Trigger Safety Agent
 */

import { StateGraph } from '@langchain/langgraph';
import type {
  DocumentationAgentState,
  SOAPReport,
  TriageLabel,
  SeverityLevel,
  ChatMessage,
  DiagnosisState,
  PatientInfo,
} from './types';
import { DocumentationAgentStateSchema } from './types';
import { generateSOAPReport } from './llm-utils';
import prisma from '@/lib/prisma';
import { determineDepartment as getDepartmentFromSymptoms } from '@/lib/constants/departments';

/**
 * Normalize severity value to match expected enum
 * Maps various LLM outputs to: 'critical' | 'high' | 'moderate' | 'initial' | 'normal'
 */
function normalizeSeverity(severity: string | undefined): SeverityLevel {
  if (!severity) return 'moderate';

  const s = severity.toLowerCase().trim();

  // Direct matches
  if (['critical', 'high', 'moderate', 'initial', 'normal'].includes(s)) {
    return s as SeverityLevel;
  }

  // Map common LLM outputs to valid enum values
  const severityMap: Record<string, SeverityLevel> = {
    severe: 'critical',
    'very high': 'critical',
    emergency: 'critical',
    urgent: 'high',
    elevated: 'high',
    medium: 'moderate',
    mild: 'normal',
    low: 'normal',
    minimal: 'normal',
    none: 'normal',
  };

  return severityMap[s] || 'moderate';
}

/**
 * Normalize urgency/triage value
 */
function normalizeUrgency(urgency: string | undefined): TriageLabel {
  if (!urgency) return 'standard';

  const u = urgency.toLowerCase().trim();

  if (['emergency', 'urgent', 'standard', 'routine'].includes(u)) {
    return u as TriageLabel;
  }

  // Map common values
  const urgencyMap: Record<string, TriageLabel> = {
    critical: 'emergency',
    immediate: 'emergency',
    high: 'urgent',
    moderate: 'standard',
    low: 'routine',
    normal: 'routine',
  };

  return urgencyMap[u] || 'standard';
}

/**
 * Determine triage label based on severity and symptoms
 */
function determineTriageLabel(
  severity: string,
  symptoms: string[],
  redFlags: string[]
): TriageLabel {
  // Emergency keywords
  const emergencyKeywords = [
    'chest pain',
    'difficulty breathing',
    'unconscious',
    'severe bleeding',
    'stroke',
    'heart attack',
  ];

  const urgentKeywords = [
    'high fever',
    'severe pain',
    'sudden onset',
    'worsening',
    'persistent vomiting',
  ];

  const allSymptoms = symptoms.join(' ').toLowerCase();

  if (
    redFlags.length > 0 ||
    emergencyKeywords.some(k => allSymptoms.includes(k))
  ) {
    return 'emergency';
  }

  if (severity === 'critical' || severity === 'high') {
    return 'urgent';
  }

  if (urgentKeywords.some(k => allSymptoms.includes(k))) {
    return 'urgent';
  }

  if (severity === 'moderate') {
    return 'standard';
  }

  return 'routine';
}

/**
 * Node: Compile session data
 */
async function compileSessionData(state: DocumentationAgentState) {
  console.log('\n📝 [Documentation Agent] Compiling session data...');

  // Extract chief complaint from first user message
  const firstUserMessage = state.conversationHistory.find(
    m => m.role === 'user'
  );
  const chiefComplaint =
    firstUserMessage?.content || 'Clinical interview conducted';

  console.log(`   📋 Chief complaint: ${chiefComplaint.slice(0, 50)}...`);
  console.log(`   💬 Total messages: ${state.conversationHistory.length}`);

  return {};
}

/**
 * Node: Generate SOAP report
 */
async function generateReport(state: DocumentationAgentState) {
  console.log('\n📄 [Documentation Agent] Generating SOAP report...');

  const { conversationHistory, diagnosisState, patientInfo, ragSources } =
    state;

  // Prepare data for SOAP generation
  const soapData = await generateSOAPReport({
    conversationHistory: conversationHistory.map(m => ({
      role: m.role,
      content: m.content,
    })),
    patientInfo: patientInfo || {},
    diagnosisState: {
      potentialDiseases:
        diagnosisState?.potentialDiseases.map(d => ({
          name: d.name,
          probability: d.probability,
        })) || [],
      identifiedSymptoms: diagnosisState?.identifiedSymptoms || [],
      confidenceScore: diagnosisState?.confidenceScore || 50,
    },
    ragSources,
  });

  // Build full SOAP report with normalized severity values
  const soapReport: SOAPReport = {
    subjective: {
      chiefComplaint:
        soapData.subjective?.chiefComplaint || 'Clinical interview',
      symptoms:
        soapData.subjective?.symptoms ||
        diagnosisState?.identifiedSymptoms ||
        [],
      patientHistory: state.medicalHistory,
      patientNarrative: soapData.subjective?.patientNarrative || '',
    },
    objective: {
      reportedSymptoms: soapData.objective?.reportedSymptoms || [],
      severity: normalizeSeverity(soapData.objective?.severity),
      confidenceLevel: soapData.objective?.confidenceLevel || 50,
    },
    assessment: {
      primaryDiagnosis:
        soapData.assessment?.primaryDiagnosis ||
        diagnosisState?.potentialDiseases[0]?.name ||
        'Under evaluation',
      differentialDiagnosis:
        soapData.assessment?.differentialDiagnosis ||
        diagnosisState?.potentialDiseases.slice(1, 4).map(d => d.name) ||
        [],
      severity: normalizeSeverity(soapData.assessment?.severity),
      confidence:
        soapData.assessment?.confidence ||
        diagnosisState?.confidenceScore ||
        50,
      aiAnalysis: soapData.assessment?.aiAnalysis || '',
      redFlags: soapData.assessment?.redFlags || [],
      medicalSources: ragSources,
    },
    plan: {
      recommendations: soapData.plan?.recommendations || [
        'Consult with physician',
      ],
      testsNeeded: soapData.plan?.testsNeeded || [],
      specialistReferral: soapData.plan?.specialistReferral,
      followUpNeeded: soapData.plan?.followUpNeeded ?? true,
      urgency: normalizeUrgency(soapData.plan?.urgency),
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      sessionId: state.sessionId,
      patientId: state.patientId,
      triageLabel: 'standard',
      aiVersion: 'sehat-guftagu-v2.0',
    },
  };

  // Determine department using centralized function
  const department = getDepartmentFromSymptoms(
    diagnosisState?.identifiedSymptoms || [],
    diagnosisState?.potentialDiseases || []
  );

  // Determine triage label
  const triageLabel = determineTriageLabel(
    soapReport.assessment.severity,
    soapReport.subjective.symptoms,
    soapReport.assessment.redFlags
  );

  soapReport.metadata.department = department;
  soapReport.metadata.triageLabel = triageLabel;

  console.log(`   ✅ SOAP report generated`);
  console.log(`   🏥 Department: ${department}`);
  console.log(`   🚨 Triage: ${triageLabel}`);

  return {
    soapReport,
    department,
    triageLabel,
  };
}

/**
 * Node: Save report to Supabase
 */
async function saveReportToDb(state: DocumentationAgentState) {
  console.log('\n💾 [Documentation Agent] Saving report to database...');

  if (!state.soapReport || !state.sessionId || !state.patientId) {
    console.error('   ❌ Missing required data:', {
      hasReport: !!state.soapReport,
      hasSessionId: !!state.sessionId,
      hasPatientId: !!state.patientId,
    });
    return { savedToDb: false };
  }

  try {
    console.log('   📋 Report data:', {
      sessionId: state.sessionId,
      patientId: state.patientId,
      department: state.department,
      triageLabel: state.triageLabel,
      subjective: state.soapReport.subjective ? 'Present' : 'Missing',
      objective: state.soapReport.objective ? 'Present' : 'Missing',
      assessment: state.soapReport.assessment ? 'Present' : 'Missing',
      plan: state.soapReport.plan ? 'Present' : 'Missing',
    });

    // DEBUG: Log the exact object being passed to create/update
    const saveData = {
      subjective: state.soapReport.subjective,
      objective: state.soapReport.objective,
      assessment: state.soapReport.assessment,
      plan: state.soapReport.plan,
      department: state.department,
      priority:
        state.triageLabel === 'emergency'
          ? 'urgent'
          : state.triageLabel === 'urgent'
            ? 'high'
            : 'normal',
      reviewStatus: 'pending',
    };
    console.log('   💾 Saving payload preview:', JSON.stringify(saveData, null, 2));
    // Check if report already exists
    const existingReport = await prisma.sOAPReport.findUnique({
      where: { sessionId: state.sessionId },
    });

    if (existingReport) {
      // Update existing report
      const updated = await prisma.sOAPReport.update({
        where: { sessionId: state.sessionId },
        data: {
          subjective: state.soapReport.subjective,
          objective: state.soapReport.objective,
          assessment: state.soapReport.assessment,
          plan: state.soapReport.plan,
          department: state.department,
          priority:
            state.triageLabel === 'emergency'
              ? 'urgent'
              : state.triageLabel === 'urgent'
                ? 'high'
                : 'normal',
          reviewStatus: 'pending',
          updatedAt: new Date(),
        },
      });

      console.log(`   ✅ Report updated: ${updated.id}`);
      return { savedToDb: true, reportId: updated.id };
    } else {
      // Create new report
      const created = await prisma.sOAPReport.create({
        data: {
          sessionId: state.sessionId,
          patientId: state.patientId,
          subjective: state.soapReport.subjective,
          objective: state.soapReport.objective,
          assessment: state.soapReport.assessment,
          plan: state.soapReport.plan,
          department: state.department,
          priority:
            state.triageLabel === 'emergency'
              ? 'urgent'
              : state.triageLabel === 'urgent'
                ? 'high'
                : 'normal',
          reviewStatus: 'pending',
        },
      });

      console.log(`   ✅ Report created: ${created.id}`);
      return { savedToDb: true, reportId: created.id };
    }
  } catch (error: any) {
    console.error('   ❌ Database error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    });
    return { savedToDb: false };
  }
}

/**
 * Node: Update clinical session status
 */
async function updateSessionStatus(state: DocumentationAgentState) {
  console.log('\n🔄 [Documentation Agent] Updating session status...');

  // CRITICAL FIX: Only mark session as completed if the report was actually saved!
  if (!state.savedToDb) {
    console.error('   ❌ Skipping session completion because report was not saved to DB');
    return {};
  }

  try {
    await prisma.clinicalSession.update({
      where: { id: state.sessionId },
      data: {
        status: 'completed',
        identifiedSymptoms: state.diagnosisState?.identifiedSymptoms || [],
        confidenceScore: state.diagnosisState?.confidenceScore
          ? state.diagnosisState.confidenceScore / 100
          : null,
        differentialDiagnosis:
          state.diagnosisState?.potentialDiseases.map(d => d.name) || [],
        redFlagsDetected: state.soapReport?.assessment.redFlags || [],
        updatedAt: new Date(),
      },
    });
    console.log('   ✅ Session marked as completed');
  } catch (error) {
    console.error('   ❌ Failed to update session:', error);
  }

  return {};
}

/**
 * Build the Documentation Agent Graph
 */
export function createDocumentationAgent() {
  const workflow = new StateGraph(DocumentationAgentStateSchema)
    .addNode('compile_data', compileSessionData)
    .addNode('generate_report', generateReport)
    .addNode('save_to_db', saveReportToDb)
    .addNode('update_session', updateSessionStatus)
    .addEdge('__start__', 'compile_data')
    .addEdge('compile_data', 'generate_report')
    .addEdge('generate_report', 'save_to_db')
    .addEdge('save_to_db', 'update_session')
    .addEdge('update_session', '__end__');

  return workflow.compile();
}

/**
 * Generate SOAP report for a completed session
 */
export async function generateSOAPForSession(params: {
  sessionId: string;
  patientId: string;
  conversationHistory: ChatMessage[];
  diagnosisState: DiagnosisState;
  patientInfo: PatientInfo | null;
  medicalHistory: string;
  ragSources: string[];
}): Promise<{
  soapReport: SOAPReport | null;
  department: string;
  triageLabel: TriageLabel;
  savedToDb: boolean;
  reportId: string;
}> {
  const agent = createDocumentationAgent();

  const result = await agent.invoke({
    sessionId: params.sessionId,
    patientId: params.patientId,
    conversationHistory: params.conversationHistory,
    diagnosisState: params.diagnosisState,
    patientInfo: params.patientInfo,
    medicalHistory: params.medicalHistory,
    ragSources: params.ragSources,
    soapReport: null,
    department: '',
    triageLabel: 'standard' as TriageLabel,
    savedToDb: false,
    reportId: '',
  });

  return {
    soapReport: result.soapReport,
    department: result.department,
    triageLabel: result.triageLabel,
    savedToDb: result.savedToDb,
    reportId: result.reportId,
  };
}

export { determineTriageLabel };
