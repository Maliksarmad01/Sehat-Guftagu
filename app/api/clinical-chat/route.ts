/**
 * Clinical Chat API - Multi-Agent Orchestration
 *
 * This endpoint uses the LangGraph multi-agent orchestration system:
 * 1. Interview & Reasoning Agent (with sub-agents) - DURING chat
 * 2. Documentation Agent (SOAP generation) - AFTER interview ends at 95% confidence
 * 3. Safety Agent (triage labeling) - AFTER SOAP generation
 *
 * SOAP/Safety agents only trigger when interview is complete (95% confidence)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  orchestrateClinicalInterview,
  completeInterviewAndGenerateReport,
} from '@/lib/agents';
import type { ChatMessage, DiagnosisState, PatientInfo } from '@/lib/agents';
import { applyGuardrails, validateUserInput } from '@/lib/agents/guardrails';
import prisma from '@/lib/prisma';

// Helper to get patient info from database
async function getPatientInfo(userId: string): Promise<{
  patientInfo: PatientInfo | null;
  medicalHistory: string;
}> {
  try {
    const history = await prisma.medicalHistory.findUnique({
      where: { patientId: userId },
    });

    if (!history) {
      return { patientInfo: null, medicalHistory: '' };
    }

    const patientInfo: PatientInfo = {
      id: userId,
      age: history.age || undefined,
      gender: history.gender || undefined,
      bloodGroup: history.bloodGroup || undefined,
      weight: history.weight || undefined,
      height: history.height || undefined,
      chronicConditions: (history.chronicConditions as string[]) || [],
      currentMedications: (history.currentMedications as string[]) || [],
      allergies: (history.allergies as string[]) || [],
      familyHistory: (history.familyHistory as Record<string, boolean>) || {},
      smokingStatus: history.smokingStatus || undefined,
      alcoholConsumption: history.alcoholConsumption || undefined,
    };

    const medicalHistory = `
Patient Profile:
- Age: ${patientInfo.age || 'Unknown'}
- Gender: ${patientInfo.gender || 'Unknown'}
- Blood Group: ${patientInfo.bloodGroup || 'Unknown'}
- Chronic Conditions: ${patientInfo.chronicConditions.join(', ') || 'None'}
- Current Medications: ${patientInfo.currentMedications.join(', ') || 'None'}
- Allergies: ${patientInfo.allergies.join(', ') || 'None'}
- Smoking: ${patientInfo.smokingStatus || 'Unknown'}
- Alcohol: ${patientInfo.alcoholConsumption || 'Unknown'}
`;

    return { patientInfo, medicalHistory };
  } catch (error) {
    console.error('Error fetching patient info:', error);
    return { patientInfo: null, medicalHistory: '' };
  }
}

// POST - Process clinical interview message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      sessionId,
      userId,
      conversationHistory = [],
      diagnosisState,
      conversationTurn = 0,
      generateReport = false, // NEW: Flag to trigger SOAP/Safety agents after interview ends
    } = body;

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and userId are required' },
        { status: 400 }
      );
    }

    // ========== LLM GUARDRAILS: Validate user input ==========
    const inputValidation = validateUserInput(message);
    if (!inputValidation.isAllowed) {
      console.log('🛡️ GUARDRAIL: Blocked harmful input');
      return NextResponse.json({
        success: true,
        response: {
          content:
            inputValidation.redirectResponse ||
            "I'm sorry, but I cannot process that request. Please describe your symptoms and I'll help you.",
          urdu: 'معذرت، میں اس درخواست پر عمل نہیں کر سکتا۔ براہ کرم اپنی علامات بیان کریں۔',
          severity: 'normal',
          confidenceLevel: 0,
          identifiedSymptoms: [],
          isConfident: false,
          followUpNeeded: true,
          potentialDiseases: [],
          guardrailTriggered: true,
        },
        nextState: {
          conversationHistory,
          diagnosisState,
          conversationTurn,
        },
      });
    }

    console.log('\n' + '🏥'.repeat(30));
    console.log('📨 MULTI-AGENT CLINICAL CHAT');
    console.log('   User:', userId);
    console.log('   Session:', sessionId);
    console.log(
      '   Message:',
      message.slice(0, 100) + (message.length > 100 ? '...' : '')
    );
    console.log('   Turn:', conversationTurn);
    console.log('   Generate Report:', generateReport);
    console.log('🏥'.repeat(30) + '\n');

    // Convert conversation history to ChatMessage format
    const chatHistory: ChatMessage[] = conversationHistory.map((m: any) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp || new Date().toISOString(),
    }));

    // Parse diagnosis state if provided as JSON string
    let parsedDiagnosisState: DiagnosisState | undefined;
    if (diagnosisState) {
      parsedDiagnosisState =
        typeof diagnosisState === 'string'
          ? JSON.parse(diagnosisState)
          : diagnosisState;
    }

    // Run the interview agent orchestration
    const result = await orchestrateClinicalInterview({
      patientId: userId,
      sessionId: sessionId || 'temp-session',
      userMessage: message,
      conversationHistory: chatHistory,
      diagnosisState: parsedDiagnosisState,
      conversationTurn,
    });

    // ========== LLM GUARDRAILS: Validate AI response ==========
    const guardrailResult = applyGuardrails(
      message,
      result.response,
      result.confidenceLevel,
      result.identifiedSymptoms,
      result.severity
    );

    // Use processed response and confidence
    const finalResponse = guardrailResult.processedResponse;
    const finalConfidence = guardrailResult.processedConfidence;

    if (guardrailResult.wasModified) {
      console.log('🛡️ GUARDRAIL: Response modified for safety');
      console.log('   Violations:', guardrailResult.violations.join(', '));
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✅ INTERVIEW AGENT RESULT:');
    console.log('   Response:', finalResponse.slice(0, 100) + '...');
    console.log('   Severity:', result.severity);
    console.log('   Confidence:', finalConfidence + '%');
    console.log(
      '   Diseases:',
      result.potentialDiseases
        .slice(0, 3)
        .map(d => d.name)
        .join(', ')
    );
    console.log('   Complete:', result.isComplete);
    console.log(
      '   Emergency Escalation:',
      guardrailResult.emergencyEscalation
    );
    console.log('═'.repeat(60) + '\n');

    // Update session in database if session exists
    if (sessionId) {
      try {
        await prisma.clinicalSession.update({
          where: { id: sessionId },
          data: {
            conversationLog: JSON.parse(
              JSON.stringify(result.conversationHistory)
            ),
            identifiedSymptoms: result.identifiedSymptoms,
            confidenceScore: finalConfidence / 100,
            differentialDiagnosis: result.potentialDiseases.map(d => d.name),
            redFlagsDetected: result.emergencyCheck?.flags || [],
            status: result.isComplete ? 'completed' : 'in_progress',
            updatedAt: new Date(),
          },
        });
      } catch (dbError) {
        console.error('Session update error:', dbError);
      }
    }

    // ========== SOAP/SAFETY AGENTS: Auto-trigger when interview completes ==========
    let reportGenerated = false;
    let reportId = '';
    let department = '';
    let triageLabel = '';

    if (sessionId && result.isComplete) {
      console.log('\n' + '═'.repeat(60));
      console.log('📄 TRIGGERING POST-INTERVIEW AGENTS');
      console.log('   - Documentation Agent (SOAP Generation)');
      console.log('   - Safety Agent (Emergency Triage)');
      console.log('   - Department Selection');
      console.log('═'.repeat(60) + '\n');

      const { patientInfo, medicalHistory } = await getPatientInfo(userId);

      const reportResult = await completeInterviewAndGenerateReport({
        sessionId,
        patientId: userId,
        conversationHistory: result.conversationHistory,
        diagnosisState: result.diagnosisState,
        patientInfo,
        medicalHistory,
        ragSources: [],
      });

      if (reportResult.soapReport) {
        reportGenerated = true;
        reportId = reportResult.reportId;
        department = reportResult.department;
        triageLabel = reportResult.triageLabel;
        console.log('✅ SOAP Report generated:', reportId);
        console.log('   Department:', department);
        console.log('   Triage:', triageLabel);
      }
    }

    // Build thinking steps for UI (only interview agents during chat)
    const thinkingSteps = [
      {
        title: 'Translation Agent',
        content: `Translating patient message to English for medical processing.`,
      },
      {
        title: 'RAG Retrieval Agent',
        content: `Searching medical knowledge base (Pinecone) for relevant information.`,
      },
      {
        title: 'Disease Identification Agent',
        content: `Identified ${result.potentialDiseases.length} potential conditions. Top candidates: ${result.potentialDiseases
          .slice(0, 3)
          .map(d => `${d.name} (${d.probability}%)`)
          .join(', ')}`,
      },
      {
        title: 'Reasoning Agent',
        content: `Confidence level: ${finalConfidence}%. ${result.isComplete ? 'Diagnosis ready - click to generate report.' : 'Gathering more information to narrow diagnosis.'}`,
      },
    ];

    // Add post-interview agent steps if report was generated
    if (reportGenerated) {
      thinkingSteps.push(
        {
          title: 'Documentation Agent',
          content: `SOAP report generated successfully. Report ID: ${reportId}`,
        },
        {
          title: 'Safety Agent',
          content: `Emergency triage completed. Label: ${triageLabel}`,
        },
        {
          title: 'Department Selection',
          content: `Patient assigned to: ${department}`,
        }
      );
    }

    // Generate thank you message if interview is complete
    const completionMessage = result.isComplete
      ? "\n\n🎉 Thank you for completing the clinical interview session! Your responses have been recorded. Click 'Generate Report' to create your medical assessment report."
      : '';

    // Build response
    return NextResponse.json({
      success: true,
      response: {
        content: finalResponse + completionMessage,
        urdu:
          result.responseUrdu +
          (result.isComplete
            ? '\n\n🎉 کلینیکل انٹرویو سیشن مکمل کرنے کا شکریہ! آپ کے جوابات محفوظ کر لیے گئے ہیں۔'
            : ''),
        severity: result.severity,
        confidenceLevel: finalConfidence,
        identifiedSymptoms: result.identifiedSymptoms,
        isConfident: result.isComplete,
        followUpNeeded: !result.isComplete,
        potentialDiseases: result.potentialDiseases,
        diagnosisSummary: result.isComplete
          ? `Assessment complete with ${finalConfidence}% confidence. Primary condition: ${result.potentialDiseases[0]?.name || 'Under evaluation'}`
          : null,
        thinkingSteps: thinkingSteps,
        emergencyFlags: result.emergencyCheck?.flags || [],
        emergencyEscalation: guardrailResult.emergencyEscalation,
        guardrailModified: guardrailResult.wasModified,
      },
      // Agent orchestration metadata
      orchestration: {
        agentActions: result.agentActions,
        conversationTurn: result.conversationHistory.length / 2,
        isInterviewComplete: result.isComplete,
        reportGenerated,
        reportId: reportId || undefined,
        department: department || undefined,
        triageLabel: triageLabel || undefined,
      },
      // State for next turn
      nextState: {
        conversationHistory: result.conversationHistory,
        diagnosisState: result.diagnosisState,
        conversationTurn: result.conversationHistory.length / 2,
      },
    });
  } catch (error) {
    console.error('❌ CLINICAL CHAT ERROR:', error);
    return NextResponse.json(
      { error: 'Failed to process message', details: String(error) },
      { status: 500 }
    );
  }
}

// PUT - Create new clinical session
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, chiefComplaint } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    console.log('\n📝 Creating new clinical session for user:', userId);

    const session = await prisma.clinicalSession.create({
      data: {
        patientId: userId,
        chiefComplaint: chiefComplaint || null,
        conversationLog: [],
        identifiedSymptoms: [],
        redFlagsDetected: [],
        differentialDiagnosis: [],
        status: 'in_progress',
      },
    });

    console.log('✅ Clinical session created:', session.id);

    return NextResponse.json({
      success: true,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('❌ Create session error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
