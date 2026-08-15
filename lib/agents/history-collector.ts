/**
 * History Collector Agent
 * Agent 1: Collects medical history during patient onboarding
 *
 * Flow:
 * 1. Start with greeting
 * 2. Ask 15 sequential questions about medical history
 * 3. Parse and validate responses
 * 4. Save to Supabase when complete
 */

import { StateGraph, END } from '@langchain/langgraph';
import type {
  HistoryCollectorState,
  ChatMessage,
  MedicalHistoryData,
} from './types';
import { HistoryCollectorStateSchema } from './types';
import { groqLLM } from './llm-utils';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import prisma from '@/lib/prisma';

// Medical history questions (bilingual)
const MEDICAL_HISTORY_QUESTIONS = [
  {
    id: 0,
    field: 'greeting',
    english:
      "Hello! I'm your health assistant. Let me ask you a few questions about your medical history. This will help us provide better care. What is your age?",
    urdu: 'السلام علیکم! میں آپ کا صحت معاون ہوں۔ آئیے آپ کی طبی تاریخ کے بارے میں کچھ سوالات پوچھتے ہیں۔ آپ کی عمر کتنی ہے؟',
    type: 'number',
    targetField: 'age',
  },
  {
    id: 1,
    field: 'gender',
    english: 'What is your gender? (Male/Female/Other)',
    urdu: 'آپ کی جنس کیا ہے؟ (مرد/عورت/دیگر)',
    type: 'select',
    options: ['male', 'female', 'other'],
    targetField: 'gender',
  },
  {
    id: 2,
    field: 'bloodGroup',
    english:
      'What is your blood group? (A+, A-, B+, B-, O+, O-, AB+, AB-, or unknown)',
    urdu: 'آپ کا بلڈ گروپ کیا ہے؟ (A+، A-، B+، B-، O+، O-، AB+، AB-، یا نامعلوم)',
    type: 'select',
    targetField: 'bloodGroup',
  },
  {
    id: 3,
    field: 'weight',
    english: 'What is your weight in kilograms (kg)?',
    urdu: 'آپ کا وزن کتنے کلوگرام ہے؟',
    type: 'number',
    targetField: 'weight',
  },
  {
    id: 4,
    field: 'height',
    english: 'What is your height in centimeters (cm)?',
    urdu: 'آپ کا قد کتنے سینٹی میٹر ہے؟',
    type: 'number',
    targetField: 'height',
  },
  {
    id: 5,
    field: 'familyDiabetes',
    english: 'Does anyone in your family have diabetes (sugar disease)?',
    urdu: 'کیا آپ کے خاندان میں کسی کو شوگر کی بیماری ہے؟',
    type: 'boolean',
    targetField: 'familyHistory.diabetes',
  },
  {
    id: 6,
    field: 'familyHeart',
    english: 'Does anyone in your family have heart disease?',
    urdu: 'کیا آپ کے خاندان میں کسی کو دل کی بیماری ہے؟',
    type: 'boolean',
    targetField: 'familyHistory.heart_disease',
  },
  {
    id: 7,
    field: 'familyHypertension',
    english:
      'Does anyone in your family have high blood pressure (hypertension)?',
    urdu: 'کیا آپ کے خاندان میں کسی کو ہائی بلڈ پریشر ہے؟',
    type: 'boolean',
    targetField: 'familyHistory.hypertension',
  },
  {
    id: 8,
    field: 'familyCancer',
    english: 'Does anyone in your family have a history of cancer?',
    urdu: 'کیا آپ کے خاندان میں کسی کو کینسر کی تاریخ ہے؟',
    type: 'boolean',
    targetField: 'familyHistory.cancer',
  },
  {
    id: 9,
    field: 'chronicConditions',
    english:
      "Do you have any chronic conditions? (e.g., diabetes, heart disease). List them or say 'none'.",
    urdu: "کیا آپ کو کوئی دائمی بیماری ہے؟ (مثلاً شوگر، دل کی بیماری)۔ بتائیں یا 'نہیں' کہیں۔",
    type: 'list',
    targetField: 'chronicConditions',
  },
  {
    id: 10,
    field: 'currentMedications',
    english:
      "Are you currently taking any medications? Please list them or say 'none'.",
    urdu: "کیا آپ ابھی کوئی دوائی لے رہے ہیں؟ بتائیں یا 'نہیں' کہیں۔",
    type: 'list',
    targetField: 'currentMedications',
  },
  {
    id: 11,
    field: 'allergies',
    english:
      "Do you have any allergies? (medicines, food, dust, etc.) List them or say 'none'.",
    urdu: "کیا آپ کو کوئی الرجی ہے؟ (دوائیں، کھانا، دھول وغیرہ) بتائیں یا 'نہیں' کہیں۔",
    type: 'list',
    targetField: 'allergies',
  },
  {
    id: 12,
    field: 'pastSurgeries',
    english: "Have you had any surgeries in the past? List them or say 'none'.",
    urdu: "کیا آپ کا ماضی میں کوئی آپریشن ہو ا ہے؟ بتائیں یا 'نہیں' کہیں۔",
    type: 'list',
    targetField: 'pastSurgeries',
  },
  {
    id: 13,
    field: 'smokingStatus',
    english: 'Do you smoke? (never/former/current)',
    urdu: 'کیا آپ سگریٹ پیتے ہیں؟ (کبھی نہیں/پہلے پیتا تھا/ابھی پیتا ہوں)',
    type: 'select',
    options: ['never', 'former', 'current'],
    targetField: 'smokingStatus',
  },
  {
    id: 14,
    field: 'alcoholConsumption',
    english: 'Do you consume alcohol? (never/occasional/regular)',
    urdu: 'کیا آپ شراب پیتے ہیں؟ (کبھی نہیں/کبھی کبھی/باقاعدہ)',
    type: 'select',
    options: ['never', 'occasional', 'regular'],
    targetField: 'alcoholConsumption',
  },
];

const TOTAL_QUESTIONS = MEDICAL_HISTORY_QUESTIONS.length;

/**
 * Parse user response based on question type
 */
async function parseResponse(
  response: string,
  questionType: string,
  options?: string[]
): Promise<any> {
  const lowerResponse = response.toLowerCase().trim();

  // Handle boolean responses
  if (questionType === 'boolean') {
    const yesPatterns = ['yes', 'haan', 'ha', 'جی', 'ہاں', 'ji', 'true', '1'];
    const noPatterns = [
      'no',
      'nahi',
      'nhi',
      'نہیں',
      'نہ',
      'false',
      '0',
      'none',
    ];

    if (yesPatterns.some(p => lowerResponse.includes(p))) return true;
    if (noPatterns.some(p => lowerResponse.includes(p))) return false;
    return null;
  }

  // Handle number responses
  if (questionType === 'number') {
    const numbers = lowerResponse.match(/\d+/);
    return numbers ? parseInt(numbers[0]) : null;
  }

  // Handle select responses
  if (questionType === 'select' && options) {
    for (const opt of options) {
      if (lowerResponse.includes(opt.toLowerCase())) return opt;
    }
    // Use LLM to interpret
    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `Extract the option from user response. Options: ${options.join(', ')}. Return ONLY the matching option or "unknown".`,
      ],
      ['human', response],
    ]);
    try {
      const chain = prompt.pipe(groqLLM).pipe(new StringOutputParser());
      const result = await chain.invoke({});
      const cleaned = result.trim().toLowerCase();
      if (options.includes(cleaned)) return cleaned;
    } catch {}
    return null;
  }

  // Handle list responses
  if (questionType === 'list') {
    const nonePatterns = [
      'none',
      'no',
      'nahi',
      'nhi',
      'نہیں',
      'کوئی نہیں',
      'nothing',
    ];
    if (nonePatterns.some(p => lowerResponse.includes(p))) return [];

    // Split by common delimiters
    const items = response
      .split(/[,،\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    return items;
  }

  return response.trim();
}

/**
 * Node: Get current question
 */
async function getNextQuestion(state: HistoryCollectorState) {
  const questionIndex = state.currentQuestion;

  if (questionIndex >= TOTAL_QUESTIONS) {
    return {
      isComplete: true,
      nextQuestion:
        "Thank you for providing your medical history! Now let's discuss your current health concern.",
      nextQuestionUrdu:
        'آپ کی طبی تاریخ فراہم کرنے کا شکریہ! اب آئیے آپ کی موجودہ صحت کے مسئلے پر بات کرتے ہیں۔',
    };
  }

  const question = MEDICAL_HISTORY_QUESTIONS[questionIndex];
  return {
    nextQuestion: question.english,
    nextQuestionUrdu: question.urdu,
    currentQuestion: questionIndex,
  };
}

/**
 * Node: Process user response
 */
async function processResponse(state: HistoryCollectorState) {
  const questionIndex = state.currentQuestion;
  const userResponse = state.userResponse;

  if (questionIndex >= TOTAL_QUESTIONS || !userResponse) {
    return {};
  }

  const question = MEDICAL_HISTORY_QUESTIONS[questionIndex];
  const parsedValue = await parseResponse(
    userResponse,
    question.type,
    question.options
  );

  // Update collected data based on target field
  const targetField = question.targetField;
  let updatedData: Partial<MedicalHistoryData> = { ...state.collectedData };

  if (targetField.startsWith('familyHistory.')) {
    const historyField = targetField.split('.')[1];
    updatedData.familyHistory = {
      ...(updatedData.familyHistory || {}),
      [historyField]: parsedValue,
    };
  } else {
    (updatedData as any)[targetField] = parsedValue;
  }

  // Add to conversation history
  const newMessages: ChatMessage[] = [
    {
      role: 'user',
      content: userResponse,
      timestamp: new Date().toISOString(),
    },
  ];

  return {
    collectedData: updatedData,
    conversationHistory: newMessages,
    currentQuestion: questionIndex + 1,
  };
}

/**
 * Node: Save to database
 */
async function saveToDatabase(state: HistoryCollectorState) {
  if (!state.isComplete || !state.patientId) {
    return { savedToDb: false };
  }

  try {
    const data = state.collectedData;

    await prisma.medicalHistory.upsert({
      where: { patientId: state.patientId },
      update: {
        age: data.age || null,
        gender: data.gender || null,
        bloodGroup: data.bloodGroup || null,
        weight: data.weight || null,
        height: data.height || null,
        familyHistory: data.familyHistory || {},
        chronicConditions: data.chronicConditions || [],
        currentMedications: data.currentMedications || [],
        allergies: data.allergies || [],
        pastSurgeries: data.pastSurgeries || [],
        smokingStatus: data.smokingStatus || null,
        alcoholConsumption: data.alcoholConsumption || null,
        onboardingTranscript: state.conversationHistory,
        isComplete: true,
      },
      create: {
        patientId: state.patientId,
        age: data.age || null,
        gender: data.gender || null,
        bloodGroup: data.bloodGroup || null,
        weight: data.weight || null,
        height: data.height || null,
        familyHistory: data.familyHistory || {},
        chronicConditions: data.chronicConditions || [],
        currentMedications: data.currentMedications || [],
        allergies: data.allergies || [],
        pastSurgeries: data.pastSurgeries || [],
        smokingStatus: data.smokingStatus || null,
        alcoholConsumption: data.alcoholConsumption || null,
        onboardingTranscript: state.conversationHistory,
        isComplete: true,
      },
    });

    console.log('✅ Medical history saved for patient:', state.patientId);
    return { savedToDb: true };
  } catch (error) {
    console.error('❌ Failed to save medical history:', error);
    return { savedToDb: false };
  }
}

/**
 * Conditional: Check if collection is complete
 */
function shouldSaveToDb(state: HistoryCollectorState): 'save' | 'continue' {
  return state.isComplete ? 'save' : 'continue';
}

/**
 * Build the History Collector Agent Graph
 */
export function createHistoryCollectorAgent() {
  const workflow = new StateGraph(HistoryCollectorStateSchema)
    .addNode('get_question', getNextQuestion)
    .addNode('process_response', processResponse)
    .addNode('save_to_db', saveToDatabase)
    .addEdge('__start__', 'process_response')
    .addEdge('process_response', 'get_question')
    .addConditionalEdges('get_question', shouldSaveToDb, {
      save: 'save_to_db',
      continue: '__end__',
    })
    .addEdge('save_to_db', '__end__');

  return workflow.compile();
}

/**
 * Run single step of history collection
 */
export async function runHistoryCollectionStep(
  patientId: string,
  currentQuestion: number,
  userResponse: string,
  collectedData: Partial<MedicalHistoryData> = {},
  conversationHistory: ChatMessage[] = []
): Promise<{
  nextQuestion: string;
  nextQuestionUrdu: string;
  isComplete: boolean;
  savedToDb: boolean;
  collectedData: Partial<MedicalHistoryData>;
  conversationHistory: ChatMessage[];
  currentQuestionIndex: number;
}> {
  const agent = createHistoryCollectorAgent();

  const result = await agent.invoke({
    patientId,
    currentQuestion,
    userResponse,
    collectedData,
    conversationHistory,
    isComplete: false,
    nextQuestion: '',
    nextQuestionUrdu: '',
    savedToDb: false,
  });

  return {
    nextQuestion: result.nextQuestion,
    nextQuestionUrdu: result.nextQuestionUrdu,
    isComplete: result.isComplete,
    savedToDb: result.savedToDb,
    collectedData: result.collectedData,
    conversationHistory: result.conversationHistory,
    currentQuestionIndex: result.currentQuestion,
  };
}

/**
 * Get initial greeting question
 */
export function getInitialQuestion(): {
  question: string;
  questionUrdu: string;
  questionIndex: number;
} {
  const firstQuestion = MEDICAL_HISTORY_QUESTIONS[0];
  return {
    question: firstQuestion.english,
    questionUrdu: firstQuestion.urdu,
    questionIndex: 0,
  };
}

export { MEDICAL_HISTORY_QUESTIONS, TOTAL_QUESTIONS };
