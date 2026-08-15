# AI Agents Documentation

## Overview

Sehat Guftagu uses a multi-agent system built on LangGraph for orchestrating clinical interviews. Each agent is a specialized StateGraph that handles a specific part of the clinical workflow.

## Agent Index

| #   | Agent                 | Purpose                     | File                     |
| --- | --------------------- | --------------------------- | ------------------------ |
| 1   | History Collector     | Medical history onboarding  | `history-collector.ts`   |
| 2   | Interview & Reasoning | Clinical interview with RAG | `interview-agent.ts`     |
| 3   | Documentation         | SOAP report generation      | `documentation-agent.ts` |
| 4   | Safety                | Emergency triage detection  | `safety-agent.ts`        |
| 5   | Feedback              | Doctor review workflow      | `feedback-agent.ts`      |

---

## 1. History Collector Agent

**File:** `lib/agents/history-collector.ts`

### Purpose

Collects comprehensive medical history from patients during onboarding through a structured questionnaire.

### Configuration

```typescript
const TOTAL_QUESTIONS = 15;
```

### Questions Collected

1. Age
2. Gender
3. Blood Group
4. Weight
5. Height
6. Chronic Conditions
7. Current Medications
8. Allergies
9. Past Surgeries
10. Family History (diabetes, heart disease, cancer, hypertension)
11. Smoking Status
12. Alcohol Consumption
13. Exercise Habits
14. Diet
15. Sleep Patterns

### State Schema

```typescript
interface HistoryCollectorState {
  patientId: string;
  currentQuestion: number;
  userResponse: string;
  collectedData: Record<string, any>;
  conversationHistory: ChatMessage[];
  isComplete: boolean;
  nextQuestion: string;
  nextQuestionUrdu: string;
  savedToDb: boolean;
}
```

### Functions

- `runHistoryCollectionStep()` - Process one question-answer step
- `getInitialQuestion()` - Get the first question in English and Urdu
- `saveHistoryToDatabase()` - Persist to MedicalHistory table

### Graph Flow

```
START → ask_question → process_response → save_to_db? → END
                ↑_______________|
```

---

## 2. Interview & Reasoning Agent

**File:** `lib/agents/interview-agent.ts`

![Medical RAG Workflow](./images/medical%20rag%20workflow.jpeg)
_RAG-Enhanced Clinical Interview Workflow_

### Purpose

Conducts the main clinical interview, narrowing down potential diagnoses through intelligent questioning and RAG-enhanced reasoning.

### Configuration

```typescript
const MIN_CONVERSATION_TURNS = 10;
const MAX_CONVERSATION_TURNS = 25;
const CONFIDENCE_THRESHOLD = 90; // Complete at 90%+ confidence
const MIN_DISEASES_FOR_COMPLETION = 5; // Or when <5 diseases remain
const INITIAL_DISEASE_COUNT = 50; // Start with ~50 candidates
```

### Sub-Agents (Sequential Flow)

#### 2.1 Translation Agent

- Translates Urdu to English for processing
- Uses fast 8B model for speed
- Skips translation if text is >70% English

#### 2.2 RAG Retrieval Agent

- Generates embeddings using Xenova transformers
- Queries Pinecone for relevant medical knowledge
- Returns top 5 matches with >0.25 relevance score

#### 2.3 History Fetch Agent

- Retrieves patient's medical history from database
- Formats history for context inclusion

#### 2.4 Disease Identification Agent

- Maintains list of potential diseases
- Updates probabilities based on symptoms
- Tracks matched and differentiating symptoms

#### 2.5 Reasoning Agent

- Generates clinical response
- Asks targeted follow-up questions
- Calculates confidence score
- Produces English and Urdu responses

### State Schema

```typescript
interface InterviewAgentState {
  patientId: string;
  sessionId: string;
  userMessage: string;
  userMessageTranslated: string;
  patientInfo: PatientInfo | null;
  medicalHistory: string;
  ragContext: RAGContext | null;
  queryEmbedding: number[];
  conversationHistory: ChatMessage[];
  conversationTurn: number;
  diagnosisState: DiagnosisState;
  aiResponse: string;
  aiResponseUrdu: string;
  severity: SeverityLevel;
  isInterviewComplete: boolean;
  shouldGenerateReport: boolean;
  agentActions: AgentMessage[];
}
```

### Completion Criteria

```typescript
const isComplete =
  conversationTurn >= MIN_CONVERSATION_TURNS &&
  (confidenceScore >= CONFIDENCE_THRESHOLD ||
    potentialDiseases.length <= MIN_DISEASES_FOR_COMPLETION ||
    conversationTurn >= MAX_CONVERSATION_TURNS);
```

### Graph Flow

```
START → translate → rag_retrieval → history_fetch → disease_identification → reasoning → END
```

---

## 3. Documentation Agent

**File:** `lib/agents/documentation-agent.ts`

### Purpose

Generates SOAP (Subjective, Objective, Assessment, Plan) reports from completed clinical interviews.

### SOAP Report Structure

```typescript
interface SOAPReport {
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
```

### Department Assignment

Based on primary diagnosis, assigns to one of:

- Cardiology
- Neurology
- Pulmonology
- Gastroenterology
- Orthopedics
- Dermatology
- Psychiatry
- General Medicine
- Emergency
- ENT
- Ophthalmology
- Nephrology
- Endocrinology

### Graph Flow

```
START → compile_session_data → generate_report → save_to_db → update_session_status → END
```

---

## 4. Safety Agent

**File:** `lib/agents/safety-agent.ts`

### Purpose

Performs safety checks on generated reports to detect emergencies and assign appropriate triage labels.

### Triage Labels

```typescript
type TriageLabel = 'emergency' | 'urgent' | 'standard' | 'routine';
```

### Red Flag Detection

Scans for emergency indicators such as:

- Chest pain with shortness of breath
- Sudden severe headache
- Signs of stroke (FAST)
- Severe allergic reactions
- Suicidal ideation
- Active bleeding
- Loss of consciousness
- Severe trauma

### Urgency Calculation

```typescript
interface SafetyAgentState {
  redFlagsDetected: string[];
  emergencyIndicators: string[];
  triageLabel: TriageLabel;
  urgencyScore: number; // 0-100
  safetyNotes: string;
  requiresImmediateAttention: boolean;
}
```

### Quick Emergency Check

```typescript
// For immediate screening without full agent run
const check = await quickEmergencyCheck(symptoms, complaints);
// Returns: { isEmergency: boolean, flags: string[], urgencyScore: number }
```

### Graph Flow

```
START → analyze_red_flags → calculate_urgency → update_triage → END
```

---

## 5. Feedback Agent

**File:** `lib/agents/feedback-agent.ts`

### Purpose

Handles doctor review workflow including approval, rejection, and report regeneration.

### Review Actions

```typescript
type ReviewAction = 'approve' | 'reject' | 'request_changes';
```

### Workflow

1. **Approve:** Mark report as approved, record prescription
2. **Reject:** Regenerate report with doctor's feedback
3. **Request Changes:** Similar to reject, with specific change requests

### State Schema

```typescript
interface FeedbackAgentState {
  reportId: string;
  doctorId: string;
  reviewAction: ReviewAction;
  doctorFeedback: string;
  starRating: number; // 1-5 for AI improvement
  rejectionReason: string;
  suggestedCorrections: string[];
  needsRegeneration: boolean;
  regeneratedReport: SOAPReport | null;
  finalStatus: ReviewStatus;
  prescription: string;
  doctorNotes: string;
  updatedInDb: boolean;
}
```

### Functions

- `processDoctorReview()` - Main review processing function
- `getPendingReportsForDoctor()` - Get reports by department
- `regenerateSOAPWithFeedback()` - Regenerate report based on feedback

### Graph Flow

```
START → validate_action → process_review ─┬─ approve → update_db → END
                                          ├─ reject → regenerate → save_new → END
                                          └─ request_changes → flag_changes → END
```

---

## Orchestrator

**File:** `lib/agents/index.ts`

### Main Orchestration Functions

```typescript
// History collection
orchestrateHistoryCollection(input: HistoryCollectionInput): Promise<HistoryCollectionOutput>

// Clinical interview
orchestrateClinicalInterview(input: InterviewInput): Promise<InterviewOutput>

// Documentation
orchestrateDocumentation(input: DocumentationInput): Promise<DocumentationOutput>

// Safety check
orchestrateSafetyCheck(input: SafetyInput): Promise<SafetyOutput>

// Doctor review
orchestrateDoctorReview(input: DoctorReviewInput): Promise<DoctorReviewOutput>

// Complete pipeline (Interview → Documentation → Safety)
completeInterviewAndGenerateReport(params): Promise<CompletePipelineOutput>
```

### Workflow Constants

```typescript
export const WORKFLOW_CONSTANTS = {
  TOTAL_HISTORY_QUESTIONS: 15,
  MAX_INTERVIEW_TURNS: 25,
  MIN_INTERVIEW_TURNS: 10,
  CONFIDENCE_THRESHOLD: 90,
  MIN_DISEASES_FOR_COMPLETION: 5,
  INITIAL_DISEASE_COUNT: 50,
};
```

---

## LLM Utilities

**File:** `lib/agents/llm-utils.ts`

### Models

```typescript
// Main model - for complex reasoning
const groqLLM = new ChatGroq({
  model: 'llama-3.3-70b-versatile',
  temperature: 0.3,
});

// Fast model - for translation
const groqLLMFast = new ChatGroq({
  model: 'llama-3.1-8b-instant',
  temperature: 0.1,
});
```

### Functions

- `translateToEnglish(text)` - Translate Urdu to English
- `translateToUrdu(text)` - Translate English to Urdu
- `generateClinicalResponse(params)` - Generate interview response
- `generateSOAPReport(params)` - Generate SOAP from conversation
- `regenerateSOAPWithFeedback(params)` - Regenerate with doctor feedback
- `generateEmbeddings(text)` - Create text embeddings for RAG
- `isPrimarilyEnglish(text)` - Detect if text is mostly English

---

## Guardrails

**File:** `lib/agents/guardrails.ts`

### Input Validation

- Sanitizes user messages
- Detects harmful content
- Validates message length
- Filters profanity

### Output Validation

- Ensures medical relevance
- Checks response safety
- Validates SOAP structure
