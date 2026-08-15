/**
 * Multi-Agent Orchestration Types
 * Sehat Guftagu - Healthcare Interview System
 *
 * Agents:
 * 1. History Collector Agent - Collects medical history during onboarding
 * 2. Interview & Reasoning Agent - Conducts clinical interview with RAG
 * 3. Documentation Agent - Generates SOAP reports
 * 4. Safety Agent - Checks for emergency triage labels
 * 5. Feedback Agent - Handles doctor review and regeneration
 */

import { z } from 'zod';

// ========== SEVERITY & STATUS TYPES ==========
export type SeverityLevel =
  | 'critical'
  | 'high'
  | 'moderate'
  | 'initial'
  | 'normal';
export type TriageLabel = 'emergency' | 'urgent' | 'standard' | 'routine';
export type ReviewStatus = 'pending' | 'in_review' | 'approved' | 'rejected';
export type SessionStatus = 'in_progress' | 'completed' | 'cancelled';

// ========== MESSAGE TYPES ==========
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface AgentMessage {
  agentName: string;
  action: string;
  result: any;
  timestamp: string;
}

// ========== PATIENT DATA TYPES ==========
export interface PatientInfo {
  id: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  weight?: number;
  height?: number;
  chronicConditions: string[];
  currentMedications: string[];
  allergies: string[];
  familyHistory: Record<string, boolean>;
  smokingStatus?: string;
  alcoholConsumption?: string;
}

export interface MedicalHistoryData {
  patientId: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  weight?: number;
  height?: number;
  familyHistory: Record<string, boolean>;
  chronicConditions: string[];
  currentMedications: string[];
  allergies: string[];
  pastSurgeries: string[];
  smokingStatus?: string;
  alcoholConsumption?: string;
  onboardingTranscript: ChatMessage[];
  isComplete: boolean;
}

// ========== DISEASE & DIAGNOSIS TYPES ==========
export interface DiseaseCandidate {
  name: string;
  probability: number; // 0-100
  matchedSymptoms: string[];
  differentiatingSymptoms: string[];
  severity: SeverityLevel;
}

export interface DiagnosisState {
  potentialDiseases: DiseaseCandidate[];
  confidenceScore: number; // 0-100
  identifiedSymptoms: string[];
  ruledOutDiseases: string[];
  narrowingQuestions: NarrowingQuestion[];
}

export interface NarrowingQuestion {
  question: string;
  questionUrdu: string;
  targetSymptom: string;
  targetDiseases: string[];
  priority: number;
}

// ========== SOAP REPORT TYPES ==========
export interface SOAPReport {
  subjective: {
    chiefComplaint: string;
    symptoms: string[];
    patientHistory: string;
    patientNarrative: string;
  };
  objective: {
    reportedSymptoms: string[];
    severity: SeverityLevel;
    confidenceLevel: number;
    vitalSigns?: Record<string, string>;
  };
  assessment: {
    primaryDiagnosis: string;
    differentialDiagnosis: string[];
    severity: SeverityLevel;
    confidence: number;
    aiAnalysis: string;
    redFlags: string[];
    medicalSources: string[];
  };
  plan: {
    recommendations: string[];
    testsNeeded: string[];
    specialistReferral?: string;
    followUpNeeded: boolean;
    urgency: TriageLabel;
  };
  metadata: {
    generatedAt: string;
    sessionId: string;
    patientId: string;
    department?: string;
    triageLabel: TriageLabel;
    aiVersion: string;
  };
}

// ========== RAG CONTEXT TYPES ==========
export interface RAGContext {
  context: string;
  sources: string[];
  diseases: string[];
  relevanceScore: number;
}

// ========== AGENT STATE SCHEMAS (Zod-based for LangGraph) ==========

// Chat Message Schema
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// Agent Message Schema
const AgentMessageSchema = z.object({
  agentName: z.string(),
  action: z.string(),
  result: z.any(),
  timestamp: z.string(),
});

// Disease Candidate Schema
const DiseaseCandidateSchema = z.object({
  name: z.string(),
  probability: z.number().min(0).max(100),
  matchedSymptoms: z.array(z.string()),
  differentiatingSymptoms: z.array(z.string()),
  severity: z.enum(['critical', 'high', 'moderate', 'initial', 'normal']),
});

// Narrowing Question Schema
const NarrowingQuestionSchema = z.object({
  question: z.string(),
  questionUrdu: z.string(),
  targetSymptom: z.string(),
  targetDiseases: z.array(z.string()),
  priority: z.number(),
});

// Diagnosis State Schema
const DiagnosisStateSchema = z.object({
  potentialDiseases: z.array(DiseaseCandidateSchema),
  confidenceScore: z.number().min(0).max(100),
  identifiedSymptoms: z.array(z.string()),
  ruledOutDiseases: z.array(z.string()),
  narrowingQuestions: z.array(NarrowingQuestionSchema),
});

// Patient Info Schema
const PatientInfoSchema = z.object({
  id: z.string(),
  age: z.number().optional(),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  weight: z.number().optional(),
  height: z.number().optional(),
  chronicConditions: z.array(z.string()),
  currentMedications: z.array(z.string()),
  allergies: z.array(z.string()),
  familyHistory: z.record(z.string(), z.boolean()),
  smokingStatus: z.string().optional(),
  alcoholConsumption: z.string().optional(),
});

// RAG Context Schema
const RAGContextSchema = z.object({
  context: z.string(),
  sources: z.array(z.string()),
  diseases: z.array(z.string()),
  relevanceScore: z.number(),
});

// SOAP Report Schema
const SOAPReportSchema = z.object({
  subjective: z.object({
    chiefComplaint: z.string(),
    symptoms: z.array(z.string()),
    patientHistory: z.string(),
    patientNarrative: z.string(),
  }),
  objective: z.object({
    reportedSymptoms: z.array(z.string()),
    severity: z.enum(['critical', 'high', 'moderate', 'initial', 'normal']),
    confidenceLevel: z.number(),
    vitalSigns: z.record(z.string(), z.string()).optional(),
  }),
  assessment: z.object({
    primaryDiagnosis: z.string(),
    differentialDiagnosis: z.array(z.string()),
    severity: z.enum(['critical', 'high', 'moderate', 'initial', 'normal']),
    confidence: z.number(),
    aiAnalysis: z.string(),
    redFlags: z.array(z.string()),
    medicalSources: z.array(z.string()),
  }),
  plan: z.object({
    recommendations: z.array(z.string()),
    testsNeeded: z.array(z.string()),
    specialistReferral: z.string().optional(),
    followUpNeeded: z.boolean(),
    urgency: z.enum(['emergency', 'urgent', 'standard', 'routine']),
  }),
  metadata: z.object({
    generatedAt: z.string(),
    sessionId: z.string(),
    patientId: z.string(),
    department: z.string().optional(),
    triageLabel: z.enum(['emergency', 'urgent', 'standard', 'routine']),
    aiVersion: z.string(),
  }),
});

// Medical History Data Schema
const MedicalHistoryDataSchema = z.object({
  patientId: z.string(),
  age: z.number().optional(),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  weight: z.number().optional(),
  height: z.number().optional(),
  familyHistory: z.record(z.string(), z.boolean()),
  chronicConditions: z.array(z.string()),
  currentMedications: z.array(z.string()),
  allergies: z.array(z.string()),
  pastSurgeries: z.array(z.string()),
  smokingStatus: z.string().optional(),
  alcoholConsumption: z.string().optional(),
  onboardingTranscript: z.array(ChatMessageSchema),
  isComplete: z.boolean(),
});

// History Collector Agent State Schema
export const HistoryCollectorStateSchema = z.object({
  // Input
  patientId: z.string(),
  currentQuestion: z.number().default(0),
  userResponse: z.string().default(''),

  // State
  collectedData: z.record(z.string(), z.any()).default({}),
  conversationHistory: z.array(ChatMessageSchema).default([]),

  // Output
  isComplete: z.boolean().default(false),
  nextQuestion: z.string().default(''),
  nextQuestionUrdu: z.string().default(''),
  savedToDb: z.boolean().default(false),
});

// Interview & Reasoning Agent State Schema
export const InterviewAgentStateSchema = z.object({
  // Input
  patientId: z.string(),
  sessionId: z.string(),
  userMessage: z.string(),
  userMessageTranslated: z.string().default(''),

  // Patient Context
  patientInfo: PatientInfoSchema.nullable().default(null),
  medicalHistory: z.string().default(''),

  // RAG Context
  ragContext: RAGContextSchema.nullable().default(null),
  queryEmbedding: z.array(z.number()).default([]),

  // Conversation State
  conversationHistory: z.array(ChatMessageSchema).default([]),
  conversationTurn: z.number().default(0),

  // Diagnosis State
  diagnosisState: DiagnosisStateSchema.default({
    potentialDiseases: [],
    confidenceScore: 30,
    identifiedSymptoms: [],
    ruledOutDiseases: [],
    narrowingQuestions: [],
  }),

  // Output
  aiResponse: z.string().default(''),
  aiResponseUrdu: z.string().default(''),
  severity: z
    .enum(['critical', 'high', 'moderate', 'initial', 'normal'])
    .default('initial'),
  isInterviewComplete: z.boolean().default(false),
  shouldGenerateReport: z.boolean().default(false),

  // Agent tracking
  agentActions: z.array(AgentMessageSchema).default([]),
});

// Documentation Agent State Schema
export const DocumentationAgentStateSchema = z.object({
  // Input
  sessionId: z.string(),
  patientId: z.string(),
  conversationHistory: z.array(ChatMessageSchema).default([]),
  diagnosisState: DiagnosisStateSchema.nullable().default(null),
  patientInfo: PatientInfoSchema.nullable().default(null),
  medicalHistory: z.string().default(''),
  ragSources: z.array(z.string()).default([]),

  // Output
  soapReport: SOAPReportSchema.nullable().default(null),
  department: z.string().default(''),
  triageLabel: z
    .enum(['emergency', 'urgent', 'standard', 'routine'])
    .default('standard'),
  savedToDb: z.boolean().default(false),
  reportId: z.string().default(''),
});

// Safety Agent State Schema
export const SafetyAgentStateSchema = z.object({
  // Input
  soapReport: SOAPReportSchema.nullable().default(null),
  reportId: z.string(),

  // Analysis
  redFlagsDetected: z.array(z.string()).default([]),
  emergencyIndicators: z.array(z.string()).default([]),

  // Output
  triageLabel: z
    .enum(['emergency', 'urgent', 'standard', 'routine'])
    .default('standard'),
  urgencyScore: z.number().min(0).max(100).default(0),
  safetyNotes: z.string().default(''),
  requiresImmediateAttention: z.boolean().default(false),
  updatedReport: z.boolean().default(false),
});

// Feedback Agent State Schema
export const FeedbackAgentStateSchema = z.object({
  // Input
  reportId: z.string(),
  doctorId: z.string(),
  reviewAction: z
    .enum(['approve', 'reject', 'request_changes'])
    .default('approve'),
  doctorFeedback: z.string().default(''),
  starRating: z.number().min(1).max(5).default(5),

  // Regeneration context (if rejected)
  rejectionReason: z.string().default(''),
  suggestedCorrections: z.array(z.string()).default([]),

  // Output
  needsRegeneration: z.boolean().default(false),
  regeneratedReport: SOAPReportSchema.nullable().default(null),
  finalStatus: z
    .enum(['pending', 'in_review', 'approved', 'rejected'])
    .default('pending'),
  prescription: z.string().default(''),
  doctorNotes: z.string().default(''),
  updatedInDb: z.boolean().default(false),
});

// Combined Orchestration State Schema
export const ClinicalOrchestrationStateSchema = z.object({
  // Session identifiers
  sessionId: z.string(),
  patientId: z.string(),

  // Current phase
  currentPhase: z
    .enum([
      'history_collection',
      'interview',
      'documentation',
      'safety_check',
      'doctor_review',
      'complete',
    ])
    .default('interview'),

  // Shared state across agents
  patientInfo: PatientInfoSchema.nullable().default(null),
  conversationHistory: z.array(ChatMessageSchema).default([]),

  // Diagnosis tracking
  diagnosisState: DiagnosisStateSchema.default({
    potentialDiseases: [],
    confidenceScore: 30,
    identifiedSymptoms: [],
    ruledOutDiseases: [],
    narrowingQuestions: [],
  }),

  // Generated artifacts
  soapReport: SOAPReportSchema.nullable().default(null),
  triageLabel: z
    .enum(['emergency', 'urgent', 'standard', 'routine'])
    .default('standard'),

  // Final output
  isComplete: z.boolean().default(false),
  finalReviewStatus: z
    .enum(['pending', 'in_review', 'approved', 'rejected'])
    .default('pending'),

  // Error handling
  errors: z.array(z.string()).default([]),
});

// ========== INFERRED TYPES FROM ZOD SCHEMAS ==========
export type HistoryCollectorState = z.infer<typeof HistoryCollectorStateSchema>;
export type InterviewAgentState = z.infer<typeof InterviewAgentStateSchema>;
export type DocumentationAgentState = z.infer<
  typeof DocumentationAgentStateSchema
>;
export type SafetyAgentState = z.infer<typeof SafetyAgentStateSchema>;
export type FeedbackAgentState = z.infer<typeof FeedbackAgentStateSchema>;
export type ClinicalOrchestrationState = z.infer<
  typeof ClinicalOrchestrationStateSchema
>;
