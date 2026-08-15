/**
 * Clinical Orchestration Graph
 * Main orchestrator that connects all agents in the clinical workflow
 *
 * Orchestration Flow:
 *
 *                          ┌─────────────────┐
 *                          │   Patient Login  │
 *                          └────────┬────────┘
 *                                   │
 *                    ┌──────────────▼───────────────┐
 *                    │  1. HISTORY COLLECTOR AGENT   │
 *                    │  - Asks 15 medical history    │
 *                    │    questions                  │
 *                    │  - Saves to Supabase          │
 *                    └──────────────┬───────────────┘
 *                                   │
 *                    ┌──────────────▼───────────────┐
 *                    │  2. INTERVIEW & REASONING     │
 *                    │  - Sub-agent: Translation     │
 *                    │  - Sub-agent: RAG Retrieval   │
 *                    │  - Sub-agent: History Fetch   │
 *                    │  - Sub-agent: Disease ID      │
 *                    │  - Sub-agent: Reasoning       │
 *                    │                               │
 *                    │  Starts with ~50 diseases     │
 *                    │  Narrows down with questions  │
 *                    │  Ends at 90% confidence or    │
 *                    │  <5 diseases                  │
 *                    └──────────────┬───────────────┘
 *                                   │
 *                    ┌──────────────▼───────────────┐
 *                    │  3. DOCUMENTATION AGENT       │
 *                    │  - Generates SOAP report      │
 *                    │  - Assigns department         │
 *                    │  - Saves to Supabase          │
 *                    └──────────────┬───────────────┘
 *                                   │
 *                    ┌──────────────▼───────────────┐
 *                    │  4. SAFETY AGENT              │
 *                    │  - Checks red flags           │
 *                    │  - Determines triage label    │
 *                    │  - Updates priority           │
 *                    └──────────────┬───────────────┘
 *                                   │
 *              ┌────────────────────▼────────────────────┐
 *              │         DOCTOR PORTAL                    │
 *              │         (Pending Reports)                │
 *              └────────────────────┬────────────────────┘
 *                                   │
 *                    ┌──────────────▼───────────────┐
 *                    │  5. FEEDBACK AGENT            │
 *                    │  - Doctor reviews report      │
 *                    │  - Accept/Reject/Changes      │
 *                    │  - Regenerates if rejected    │
 *                    │  - Records prescription       │
 *                    └──────────────┬───────────────┘
 *                                   │
 *                          ┌────────▼────────┐
 *                          │    Complete      │
 *                          └─────────────────┘
 */

import {
  runHistoryCollectionStep,
  getInitialQuestion,
  TOTAL_QUESTIONS,
} from './history-collector';
import {
  runInterviewStep,
  MAX_CONVERSATION_TURNS,
  MIN_CONVERSATION_TURNS,
  CONFIDENCE_THRESHOLD,
  MIN_DISEASES_FOR_COMPLETION,
  INITIAL_DISEASE_COUNT,
} from './interview-agent';
import { generateSOAPForSession } from './documentation-agent';
import { runSafetyCheck, quickEmergencyCheck } from './safety-agent';
import {
  processDoctorReview,
  getPendingReportsForDoctor,
} from './feedback-agent';
import type {
  ChatMessage,
  DiagnosisState,
  PatientInfo,
  SOAPReport,
  TriageLabel,
  MedicalHistoryData,
  SeverityLevel,
} from './types';

// ========== TYPE ALIASES ==========
export type DoctorAction = 'approve' | 'reject' | 'request_changes';

// ========== ORCHESTRATION INTERFACES ==========

export interface HistoryCollectionInput {
  patientId: string;
  currentQuestion: number;
  userResponse: string;
  collectedData?: Partial<MedicalHistoryData>;
  conversationHistory?: ChatMessage[];
}

export interface HistoryCollectionOutput {
  nextQuestion: string;
  nextQuestionUrdu: string;
  isComplete: boolean;
  savedToDb: boolean;
  collectedData: Partial<MedicalHistoryData>;
  conversationHistory: ChatMessage[];
  currentQuestionIndex: number;
  totalQuestions: number;
}

export interface InterviewInput {
  patientId: string;
  sessionId: string;
  userMessage: string;
  conversationHistory?: ChatMessage[];
  diagnosisState?: DiagnosisState;
  conversationTurn?: number;
}

export interface InterviewOutput {
  response: string;
  responseUrdu: string;
  severity: SeverityLevel;
  confidenceLevel: number;
  identifiedSymptoms: string[];
  potentialDiseases: Array<{ name: string; probability: number }>;
  isComplete: boolean;
  shouldGenerateReport: boolean;
  conversationHistory: ChatMessage[];
  diagnosisState: DiagnosisState;
  agentActions: Array<{ agentName: string; action: string; result: any }>;
  thinkingSteps: Array<{ title: string; content: string }>;
  emergencyCheck?: { isEmergency: boolean; flags: string[] };
}

export interface DocumentationInput {
  sessionId: string;
  patientId: string;
  conversationHistory: ChatMessage[];
  diagnosisState: DiagnosisState;
  patientInfo: PatientInfo | null;
  medicalHistory: string;
  ragSources: string[];
}

export interface DocumentationOutput {
  soapReport: SOAPReport | null;
  department: string;
  triageLabel: TriageLabel;
  savedToDb: boolean;
  reportId: string;
}

export interface SafetyCheckInput {
  soapReport: SOAPReport;
  reportId: string;
}

export interface SafetyCheckOutput {
  triageLabel: TriageLabel;
  redFlagsDetected: string[];
  emergencyIndicators: string[];
  urgencyScore: number;
  requiresImmediateAttention: boolean;
  safetyNotes: string;
  updatedReport: boolean;
}

export interface DoctorReviewInput {
  reportId: string;
  doctorId: string;
  action: 'approve' | 'reject' | 'request_changes';
  feedback?: string;
  starRating?: number;
  rejectionReason?: string;
  prescription?: string;
  doctorNotes?: string;
}

export interface DoctorReviewOutput {
  finalStatus: 'pending' | 'in_review' | 'approved' | 'rejected';
  needsRegeneration: boolean;
  regeneratedReport: SOAPReport | null;
  updatedInDb: boolean;
}

// ========== ORCHESTRATION FUNCTIONS ==========

/**
 * Run the History Collection workflow
 */
export async function orchestrateHistoryCollection(
  input: HistoryCollectionInput
): Promise<HistoryCollectionOutput> {
  console.log('\n' + '═'.repeat(60));
  console.log('🏥 ORCHESTRATOR: History Collection Agent');
  console.log('═'.repeat(60));

  const result = await runHistoryCollectionStep(
    input.patientId,
    input.currentQuestion,
    input.userResponse,
    input.collectedData || {},
    input.conversationHistory || []
  );

  return {
    ...result,
    totalQuestions: TOTAL_QUESTIONS,
  };
}

/**
 * Get initial history collection question
 */
export function getHistoryInitialQuestion() {
  return getInitialQuestion();
}

/**
 * Run the Clinical Interview workflow
 */
export async function orchestrateClinicalInterview(
  input: InterviewInput
): Promise<InterviewOutput> {
  console.log('\n' + '═'.repeat(60));
  console.log('🏥 ORCHESTRATOR: Clinical Interview Agent');
  console.log('═'.repeat(60));

  // Quick emergency check before full processing
  const emergencyCheck = quickEmergencyCheck([input.userMessage]);
  if (emergencyCheck.isEmergency) {
    console.log('🚨 EMERGENCY DETECTED:', emergencyCheck.flags);
  }

  const result = await runInterviewStep(
    input.patientId,
    input.sessionId,
    input.userMessage,
    input.conversationHistory || [],
    input.diagnosisState,
    input.conversationTurn || 0
  );

  // Build thinking steps for UI
  const thinkingSteps = result.agentActions.map(action => ({
    title: `${action.agentName}: ${action.action}`,
    content: JSON.stringify(action.result, null, 2),
  }));

  return {
    ...result,
    thinkingSteps,
    emergencyCheck,
  };
}

/**
 * Run the Documentation workflow (SOAP Report Generation)
 */
export async function orchestrateDocumentation(
  input: DocumentationInput
): Promise<DocumentationOutput> {
  console.log('\n' + '═'.repeat(60));
  console.log('🏥 ORCHESTRATOR: Documentation Agent');
  console.log('═'.repeat(60));

  return await generateSOAPForSession(input);
}

/**
 * Run the Safety Check workflow
 */
export async function orchestrateSafetyCheck(
  input: SafetyCheckInput
): Promise<SafetyCheckOutput> {
  console.log('\n' + '═'.repeat(60));
  console.log('🏥 ORCHESTRATOR: Safety Agent');
  console.log('═'.repeat(60));

  return await runSafetyCheck(input);
}

/**
 * Run the Doctor Review workflow
 */
export async function orchestrateDoctorReview(
  input: DoctorReviewInput
): Promise<DoctorReviewOutput> {
  console.log('\n' + '═'.repeat(60));
  console.log('🏥 ORCHESTRATOR: Feedback Agent');
  console.log('═'.repeat(60));

  return await processDoctorReview(input);
}

/**
 * Get pending reports for doctor
 */
export async function getDoctorPendingReports(doctorId: string) {
  return await getPendingReportsForDoctor(doctorId);
}

/**
 * Complete interview and generate report (combines Interview -> Documentation -> Safety)
 */
export async function completeInterviewAndGenerateReport(params: {
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
  safetyResult: SafetyCheckOutput | null;
  reportId: string;
}> {
  console.log('\n' + '═'.repeat(60));
  console.log('🏥 ORCHESTRATOR: Complete Interview Pipeline');
  console.log('═'.repeat(60));

  // Step 1: Generate SOAP Report
  console.log('\n📝 Step 1/2: Generating SOAP Report...');
  const docResult = await orchestrateDocumentation(params);

  if (!docResult.soapReport || !docResult.reportId) {
    console.log('❌ SOAP Report generation failed');
    return {
      soapReport: null,
      department: '',
      triageLabel: 'standard',
      safetyResult: null,
      reportId: '',
    };
  }

  // Step 2: Run Safety Check
  console.log('\n🔴 Step 2/2: Running Safety Check...');
  const safetyResult = await orchestrateSafetyCheck({
    soapReport: docResult.soapReport,
    reportId: docResult.reportId,
  });

  return {
    soapReport: docResult.soapReport,
    department: docResult.department,
    triageLabel: safetyResult.triageLabel,
    safetyResult,
    reportId: docResult.reportId,
  };
}

// ========== WORKFLOW CONSTANTS ==========

export const WORKFLOW_CONSTANTS = {
  TOTAL_HISTORY_QUESTIONS: TOTAL_QUESTIONS,
  MAX_INTERVIEW_TURNS: MAX_CONVERSATION_TURNS,
  MIN_INTERVIEW_TURNS: MIN_CONVERSATION_TURNS,
  CONFIDENCE_THRESHOLD: CONFIDENCE_THRESHOLD,
  MIN_DISEASES_FOR_COMPLETION: MIN_DISEASES_FOR_COMPLETION,
  INITIAL_DISEASE_COUNT: INITIAL_DISEASE_COUNT,
};

// ========== RE-EXPORTS ==========

export {
  // Types
  ChatMessage,
  DiagnosisState,
  PatientInfo,
  SOAPReport,
  TriageLabel,
  MedicalHistoryData,
  SeverityLevel,
  // Agent functions for direct use if needed
  runHistoryCollectionStep,
  runInterviewStep,
  generateSOAPForSession,
  runSafetyCheck,
  processDoctorReview,
  quickEmergencyCheck,
};
