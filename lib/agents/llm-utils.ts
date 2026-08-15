/**
 * LLM Utilities for Multi-Agent System
 * Shared LLM operations using LangChain + Groq
 */

import { ChatGroq } from '@langchain/groq';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { pipeline } from '@xenova/transformers';

// Initialize LLM instances
// Fast 8b model for simple tasks (translation) - ~3x faster than 70b
const groqLLMFast = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: 'llama-3.1-8b-instant',
  temperature: 0.2,
});

const groqLLM = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: 'llama-3.3-70b-versatile',
  temperature: 0.3,
});

const groqLLMCreative = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: 'llama-3.3-70b-versatile',
  temperature: 0.5, // Reduced from 0.6 for faster, more consistent responses
});

// Singleton for embedding pipeline
let embeddingPipeline: any = null;

/**
 * Generate embedding using local Xenova model (384-dim)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    if (!embeddingPipeline) {
      console.log('📥 Loading embedding model (Xenova/all-MiniLM-L6-v2)...');
      embeddingPipeline = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      );
    }
    const output = await embeddingPipeline(text, {
      pooling: 'mean',
      normalize: true,
    });
    return Array.from(output.data) as number[];
  } catch (e) {
    console.error('Embedding generation failed:', e);
    return new Array(384).fill(0);
  }
}

/**
 * Translate text to English (for processing) - Uses fast 8b model
 */
export async function translateToEnglish(text: string): Promise<string> {
  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `Translate to English. Medical context. Be concise.
"sr/sir"="Head", "pait"="Stomach", "dil"="Heart", "drd"="pain", "bukhar"="fever"
Return ONLY the translation.`,
    ],
    ['human', '{text}'],
  ]);

  try {
    const chain = prompt.pipe(groqLLMFast).pipe(new StringOutputParser());
    const result = await chain.invoke({ text });
    console.log(
      `🌐 Translated: "${text.slice(0, 50)}..." → "${result.slice(0, 50)}..."`
    );
    return result.trim().replace(/^"|"$/g, '');
  } catch (error) {
    console.error('Translation failed:', error);
    return text;
  }
}

/**
 * Identify potential diseases from symptoms using RAG context and LLM
 */
export async function identifyDiseases(
  symptoms: string[],
  ragContext?: string
): Promise<{ name: string; probability: number }[]> {
  if (symptoms.length === 0) return [];

  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are a medical diagnostic AI. Analyze symptoms and identify potential diseases.
Return a JSON array of diseases with probability scores.
Format: [{{"name": "Disease Name", "probability": 70}}]
Probability should be 0-100 based on symptom match.
Only return diseases that have medical basis for the symptoms.
Return ONLY valid JSON, no explanation.`,
    ],
    [
      'human',
      `Symptoms: {symptoms}
${ragContext ? `Medical Knowledge Context:\n${ragContext.slice(0, 2000)}` : ''}

Identify 3-7 potential diseases/conditions with probability scores.`,
    ],
  ]);

  try {
    const chain = prompt.pipe(groqLLM).pipe(new StringOutputParser());
    const result = await chain.invoke({ symptoms: symptoms.join(', ') });
    const match = result.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch (error) {
    console.error('Disease identification failed:', error);
  }
  return [];
}

/**
 * Generate clinical response during interview
 */
export async function generateClinicalResponse(params: {
  userMessage: string;
  medicalContext: string;
  patientHistory: string;
  conversationHistory: Array<{ role: string; content: string }>;
  potentialDiseases: string[];
  confidenceScore: number;
  identifiedSymptoms: string[];
  isReadyForDiagnosis: boolean;
}): Promise<{
  content: string;
  urdu: string;
  severity: string;
  confidenceLevel: number;
  identifiedSymptoms: string[];
  isConfident: boolean;
  diagnosisSummary?: string;
}> {
  const {
    userMessage,
    medicalContext,
    patientHistory,
    conversationHistory,
    potentialDiseases,
    confidenceScore,
    identifiedSymptoms,
    isReadyForDiagnosis,
  } = params;

  let instruction = '';
  if (isReadyForDiagnosis) {
    instruction = `DIAGNOSIS: Thank patient. Summarize condition simply. Mention report will be generated.
Start: "Thank you for completing this clinical interview session!"
Max 4 sentences. Set isConfident:true, confidenceLevel:95`;
  } else {
    instruction = `INTERVIEW: Ask ONE simple follow-up question (max 2 sentences).
Focus: ${potentialDiseases.slice(0, 3).join(', ') || 'symptoms'}
Simple language, no medical jargon. confidenceLevel: integer`;
  }

  // Limit conversation history to reduce tokens
  const recentHistory = conversationHistory.slice(-4);
  const limitedMedicalContext = medicalContext.slice(0, 800);

  // Build the JSON format instruction with escaped braces
  const jsonFormat = isReadyForDiagnosis
    ? '{{content, urdu, severity, confidenceLevel, identifiedSymptoms, isConfident, followUpNeeded, diagnosisSummary}}'
    : '{{content, urdu, severity, confidenceLevel, identifiedSymptoms, isConfident, followUpNeeded}}';

  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `Medical AI interview. Match patient's language (English/Roman Urdu). No medications.
${instruction}
Return valid JSON with these fields: ${jsonFormat}`,
    ],
    [
      'human',
      `Patient: ${patientHistory?.slice(0, 300) || 'N/A'}
Context: ${limitedMedicalContext || 'General'}
Chat: ${recentHistory.map(m => `${m.role}: ${m.content}`).join('\n')}
Message: "${userMessage}"
Diseases: ${potentialDiseases.slice(0, 5).join(', ') || 'Analyzing'}
Confidence: ${confidenceScore}%
Symptoms: ${identifiedSymptoms.slice(0, 10).join(', ') || 'None'}`,
    ],
  ]);

  try {
    const chain = prompt.pipe(groqLLMCreative).pipe(new StringOutputParser());
    const result = await chain.invoke({});
    const match = result.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        content: parsed.content || 'Please describe your symptoms.',
        urdu: parsed.urdu || 'براہ کرم علامات بیان کریں',
        severity: parsed.severity || 'moderate',
        confidenceLevel: parsed.confidenceLevel || confidenceScore,
        identifiedSymptoms: parsed.identifiedSymptoms || identifiedSymptoms,
        isConfident: parsed.isConfident || false,
        diagnosisSummary: parsed.diagnosisSummary,
      };
    }
  } catch (error) {
    console.error('Clinical response generation failed:', error);
  }

  return {
    content: 'Could you please describe your symptoms in more detail?',
    urdu: 'براہ کرم اپنی علامات کی مزید تفصیل بیان کریں',
    severity: 'moderate',
    confidenceLevel: confidenceScore,
    identifiedSymptoms: identifiedSymptoms,
    isConfident: false,
  };
}

/**
 * Generate SOAP Report from clinical session
 */
export async function generateSOAPReport(params: {
  conversationHistory: Array<{ role: string; content: string }>;
  patientInfo: any;
  diagnosisState: {
    potentialDiseases: Array<{ name: string; probability: number }>;
    identifiedSymptoms: string[];
    confidenceScore: number;
  };
  ragSources: string[];
}): Promise<{
  subjective: any;
  objective: any;
  assessment: any;
  plan: any;
}> {
  const { conversationHistory, patientInfo, diagnosisState, ragSources } =
    params;

  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are a medical documentation AI. Generate a structured SOAP report.
Return valid JSON with this exact structure:
{{
    "subjective": {{
        "chiefComplaint": "Main symptom",
        "symptoms": ["symptom1", "symptom2"],
        "patientHistory": "Relevant history",
        "patientNarrative": "Patient's own words"
    }},
    "objective": {{
        "reportedSymptoms": ["symptom1"],
        "severity": "moderate",
        "confidenceLevel": 75
    }},
    "assessment": {{
        "primaryDiagnosis": "Most likely condition",
        "differentialDiagnosis": ["other possibilities"],
        "severity": "moderate",
        "confidence": 75,
        "aiAnalysis": "Reasoning for diagnosis",
        "redFlags": []
    }},
    "plan": {{
        "recommendations": ["recommendation1"],
        "testsNeeded": ["test1"],
        "specialistReferral": "Cardiology",
        "followUpNeeded": true,
        "urgency": "standard"
    }}
}}`,
    ],
    [
      'human',
      `Generate SOAP report from this clinical session:

Patient Info:
- Age: ${patientInfo?.age || 'Unknown'}
- Gender: ${patientInfo?.gender || 'Unknown'}
- Chronic conditions: ${patientInfo?.chronicConditions?.join(', ') || 'None'}
- Medications: ${patientInfo?.currentMedications?.join(', ') || 'None'}

Conversation Summary:
${conversationHistory
        .slice(-10)
        .map(m => `${m.role}: ${m.content.slice(0, 200)}`)
        .join('\n')}

Diagnosis Analysis:
- Potential diseases: ${diagnosisState.potentialDiseases.map(d => `${d.name} (${d.probability}%)`).join(', ')}
- Identified symptoms: ${diagnosisState.identifiedSymptoms.join(', ')}
- Confidence: ${diagnosisState.confidenceScore}%

Medical sources used: ${ragSources.slice(0, 5).join(', ') || 'General knowledge'}`,
    ],
  ]);

  try {
    const chain = prompt.pipe(groqLLMCreative).pipe(new StringOutputParser());
    const result = await chain.invoke({});
    const match = result.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch (error) {
    console.error('SOAP generation failed:', error);
  }

  // Fallback SOAP structure
  return {
    subjective: {
      chiefComplaint: 'Clinical interview conducted',
      symptoms: diagnosisState.identifiedSymptoms,
      patientHistory: '',
      patientNarrative: '',
    },
    objective: {
      reportedSymptoms: diagnosisState.identifiedSymptoms,
      severity: 'moderate',
      confidenceLevel: diagnosisState.confidenceScore,
    },
    assessment: {
      primaryDiagnosis:
        diagnosisState.potentialDiseases[0]?.name || 'Under evaluation',
      differentialDiagnosis: diagnosisState.potentialDiseases
        .slice(1)
        .map(d => d.name),
      severity: 'moderate',
      confidence: diagnosisState.confidenceScore,
      aiAnalysis: 'AI analysis pending',
      redFlags: [],
    },
    plan: {
      recommendations: ['Consult with physician'],
      testsNeeded: [],
      followUpNeeded: true,
      urgency: 'standard',
    },
  };
}

/**
 * Check for emergency red flags in symptoms/diagnosis
 */
export async function checkEmergencyFlags(params: {
  symptoms: string[];
  diagnosis: string;
  patientAge?: number;
}): Promise<{
  isEmergency: boolean;
  redFlags: string[];
  triageLabel: 'emergency' | 'urgent' | 'standard' | 'routine';
  urgencyScore: number;
}> {
  const { symptoms, diagnosis, patientAge } = params;

  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are a medical triage AI. Analyze for emergency indicators.
CRITICAL RED FLAGS that require immediate attention:
- Chest pain with shortness of breath
- Sudden severe headache
- Signs of stroke (facial drooping, arm weakness, speech difficulty)
- Severe allergic reaction
- Difficulty breathing
- Heavy bleeding
- Loss of consciousness
- Severe abdominal pain

Return JSON:
{{
    "isEmergency": boolean,
    "redFlags": ["flag1", "flag2"],
    "triageLabel": "emergency|urgent|standard|routine",
    "urgencyScore": 0-100
}}`,
    ],
    [
      'human',
      `Analyze for emergency:
Symptoms: ${symptoms.join(', ')}
Diagnosis: ${diagnosis}
Patient age: ${patientAge || 'Unknown'}`,
    ],
  ]);

  try {
    const chain = prompt.pipe(groqLLM).pipe(new StringOutputParser());
    const result = await chain.invoke({});
    const match = result.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch (error) {
    console.error('Emergency check failed:', error);
  }

  return {
    isEmergency: false,
    redFlags: [],
    triageLabel: 'standard',
    urgencyScore: 30,
  };
}

/**
 * Regenerate SOAP report based on doctor feedback
 */
export async function regenerateSOAPWithFeedback(params: {
  originalReport: any;
  doctorFeedback: string;
  rejectionReason: string;
}): Promise<any> {
  const { originalReport, doctorFeedback, rejectionReason } = params;

  // Escape the report JSON for template safety
  const reportJson = JSON.stringify(originalReport, null, 2)
    .replace(/\{/g, '{{')
    .replace(/\}/g, '}}');

  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are a Senior Medical Consultant AI assisting a doctor.
Your task is to REGENERATE and REFINE a SOAP report based on the doctor's specific feedback.

CRITICAL INSTRUCTIONS:
1.  **Strictly Adhere** to the Doctor's Feedback: If they say "change diagnosis to X", DO IT. If they say "add test Y", ADD IT.
2.  **Professional Medical Tone:** Use high-quality, clinical language suitable for a medical record. Avoid vague terms.
3.  **Refine the Content:** Don't just append the feedback; rewrite the relevant sections to flow naturally.
4.  **JSON Structure:** You MUST return the exact same valid JSON structure. Do not break the schema.

Return ONLY valid JSON. No markdown, no explanations.`,
    ],
    [
      'human',
      `ORIGINAL REPORT:
${reportJson}

DOCTOR'S FEEDBACK: "${doctorFeedback}"
REJECTION REASON (if any): "${rejectionReason}"

TASK:
- Update the report to address the feedback.
- Ensure 'Assessment' and 'Plan' reflect any new clinical insights.
- If the feedback contradicts the original AI analysis, trust the doctor's feedback as authoritative.`,
    ],
  ]);

  try {
    const chain = prompt.pipe(groqLLMCreative).pipe(new StringOutputParser());
    const result = await chain.invoke({});
    const match = result.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch (error) {
    console.error('SOAP regeneration failed:', error);
  }

  return originalReport;
}

export { groqLLM, groqLLMCreative };
