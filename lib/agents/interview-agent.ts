/**
 * Interview & Reasoning Agent
 * Agent 2: Main clinical interview with sub-agents
 *
 * Sub-agents:
 * - RAG Retrieval Agent: Fetches context from Pinecone
 * - History Fetch Agent: Gets patient medical history from Supabase
 * - Disease Identification Agent: Identifies potential diseases
 * - Reasoning Agent: Generates responses and narrows down diagnosis
 *
 * Flow:
 * 1. Translate user message to English
 * 2. Generate embedding for RAG query
 * 3. Retrieve medical knowledge from Pinecone
 * 4. Fetch patient history from Supabase
 * 5. Identify potential diseases (starts with ~50, narrows down)
 * 6. Generate narrowing questions or final diagnosis
 * 7. Update confidence score based on symptom matches
 * 8. Complete when confidence >= 90% or diseases <= 5
 */

import { StateGraph, END } from '@langchain/langgraph';
import type {
  InterviewAgentState,
  ChatMessage,
  DiseaseCandidate,
  DiagnosisState,
  PatientInfo,
  RAGContext,
  SeverityLevel,
} from './types';
import { InterviewAgentStateSchema } from './types';
import {
  translateToEnglish,
  generateEmbedding,
  identifyDiseases,
  generateClinicalResponse,
} from './llm-utils';
import { queryMedicalKnowledge } from '@/lib/pinecone';
import prisma from '@/lib/prisma';

// Constants for interview completion - Optimized for speed + thoroughness
const MIN_CONVERSATION_TURNS = 10; // Minimum 10 questions before concluding (was 15)
const MAX_CONVERSATION_TURNS = 25; // Maximum 25 questions (was 30)
const CONFIDENCE_THRESHOLD = 90; // Only complete at 90%+ confidence
const MIN_DISEASES_FOR_COMPLETION = 3; // Only complete when narrowed to 3 or fewer
const MIN_CONFIDENCE_FOR_DISEASE_COMPLETION = 85; // Also need this confidence when disease count is low
const INITIAL_DISEASE_COUNT = 50; // Start with ~50 potential diseases (was 100, reduced for speed)
const MIN_TIME_MINUTES = 3; // Minimum 3 minutes interview time (was 4)
const MAX_TIME_MINUTES = 12; // Maximum 12 minutes (was 15)

// Disease elimination tracking
interface DiseaseEliminationTracker {
  initialCount: number;
  currentCount: number;
  eliminatedCount: number;
  eliminationHistory: Array<{
    turn: number;
    eliminated: string[];
    reason: string;
    remainingCount: number;
  }>;
}

/**
 * Check if text is primarily English (skip translation if so)
 */
function isPrimarilyEnglish(text: string): boolean {
  // Count ASCII letters vs non-ASCII
  const asciiLetters = text.match(/[a-zA-Z]/g)?.length || 0;
  const nonAscii = text.match(/[^\x00-\x7F]/g)?.length || 0;
  // If more than 70% ASCII letters and less than 20% non-ASCII, it's English
  const total = asciiLetters + nonAscii;
  if (total === 0) return true;
  return asciiLetters / total > 0.7 && nonAscii / total < 0.2;
}

/**
 * Sub-Agent 1: Translate user message (optimized - skip if already English)
 */
async function translateNode(state: InterviewAgentState) {
  console.log('\n🔄 [Translation Agent] Processing user message...');

  let translated: string;

  // Skip LLM translation if message is already in English
  if (isPrimarilyEnglish(state.userMessage)) {
    translated = state.userMessage;
    console.log('   ⚡ Message is English, skipping translation');
  } else {
    translated = await translateToEnglish(state.userMessage);
  }

  const agentAction = {
    agentName: 'TranslationAgent',
    action: 'translate',
    result: { original: state.userMessage, translated },
    timestamp: new Date().toISOString(),
  };

  return {
    userMessageTranslated: translated,
    agentActions: [agentAction],
  };
}

/**
 * Sub-Agent 2: Generate embedding and query RAG
 */
async function ragRetrievalNode(state: InterviewAgentState) {
  console.log('\n🔍 [RAG Retrieval Agent] Querying Pinecone...');

  // Generate embedding
  const embedding = await generateEmbedding(
    state.userMessageTranslated || state.userMessage
  );

  // Query Pinecone
  let ragContext: RAGContext = {
    context: '',
    sources: [],
    diseases: [],
    relevanceScore: 0,
  };

  try {
    const result = await queryMedicalKnowledge(embedding, 10);
    ragContext = {
      context: result.context,
      sources: result.sources,
      diseases: result.diseases,
      relevanceScore: result.sources.length > 0 ? 0.7 : 0.3,
    };
    console.log(`   ✅ Retrieved ${result.sources.length} medical sources`);
    console.log(
      `   📚 Diseases from RAG: ${result.diseases.join(', ') || 'None'}`
    );
  } catch (error) {
    console.error('   ❌ RAG retrieval failed:', error);
  }

  const agentAction = {
    agentName: 'RAGRetrievalAgent',
    action: 'query_pinecone',
    result: {
      sourcesFound: ragContext.sources.length,
      diseasesFound: ragContext.diseases.length,
    },
    timestamp: new Date().toISOString(),
  };

  return {
    queryEmbedding: embedding,
    ragContext,
    agentActions: [agentAction],
  };
}

/**
 * Sub-Agent 3: Fetch patient history from Supabase
 */
async function historyFetchNode(state: InterviewAgentState) {
  console.log(
    '\n📋 [History Fetch Agent] Getting patient data from Supabase...'
  );

  let patientInfo: PatientInfo | null = null;
  let medicalHistory = '';

  try {
    const history = await prisma.medicalHistory.findUnique({
      where: { patientId: state.patientId },
    });

    if (history) {
      patientInfo = {
        id: state.patientId,
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

      // Build history text
      medicalHistory = `
Patient Profile:
- Age: ${patientInfo.age || 'Unknown'}
- Gender: ${patientInfo.gender || 'Unknown'}
- Blood Group: ${patientInfo.bloodGroup || 'Unknown'}
- Chronic Conditions: ${patientInfo.chronicConditions.join(', ') || 'None'}
- Current Medications: ${patientInfo.currentMedications.join(', ') || 'None'}
- Allergies: ${patientInfo.allergies.join(', ') || 'None'}
- Family History: ${
        Object.entries(patientInfo.familyHistory)
          .filter(([_, v]) => v)
          .map(([k, _]) => k)
          .join(', ') || 'None reported'
      }
- Smoking: ${patientInfo.smokingStatus || 'Unknown'}
- Alcohol: ${patientInfo.alcoholConsumption || 'Unknown'}
`;
      console.log('   ✅ Patient history retrieved');
    } else {
      console.log('   ⚠️ No medical history found');
    }
  } catch (error) {
    console.error('   ❌ History fetch failed:', error);
  }

  const agentAction = {
    agentName: 'HistoryFetchAgent',
    action: 'fetch_patient_history',
    result: { hasHistory: !!patientInfo },
    timestamp: new Date().toISOString(),
  };

  return {
    patientInfo,
    medicalHistory,
    agentActions: [agentAction],
  };
}

/**
 * Sub-Agent 4: Disease identification and narrowing
 * Enhanced with 100+ disease tracking and systematic elimination
 */
async function diseaseIdentificationNode(state: InterviewAgentState) {
  console.log('\n🦠 [Disease Identification Agent] Analyzing symptoms...');

  const currentState = state.diagnosisState;
  const conversationTurn = state.conversationTurn;

  // Enhanced symptom extraction with medical terminology
  const symptomKeywords = [
    // Pain-related
    'pain',
    'drd',
    'درد',
    'ache',
    'sore',
    'sharp',
    'dull',
    'throbbing',
    'burning',
    // Common symptoms
    'fever',
    'bukhar',
    'بخار',
    'cough',
    'khansi',
    'کھانسی',
    'cold',
    'zukam',
    'headache',
    'sar dard',
    'سر درد',
    'nausea',
    'متلی',
    'vomiting',
    'ulti',
    'dizziness',
    'chakkar',
    'چکر',
    'fatigue',
    'kamzori',
    'کمزوری',
    'weakness',
    // Body parts
    'chest',
    'seena',
    'سینہ',
    'stomach',
    'pait',
    'پیٹ',
    'back',
    'kamar',
    'head',
    'throat',
    'gala',
    'گلا',
    'heart',
    'dil',
    'دل',
    'lung',
    'phepra',
    'joint',
    'jor',
    'جوڑ',
    'muscle',
    'patha',
    'skin',
    'jild',
    'جلد',
    // Severity indicators
    'severe',
    'mild',
    'moderate',
    'chronic',
    'acute',
    'sudden',
    'gradual',
    // Duration indicators
    'days',
    'din',
    'weeks',
    'hafte',
    'months',
    'mahine',
    'hours',
    'ghante',
    // Other symptoms
    'breathing',
    'saans',
    'سانس',
    'swelling',
    'sujan',
    'سوجن',
    'rash',
    'daane',
    'itching',
    'khujli',
    'کھجلی',
    'bleeding',
    'khoon',
    'خون',
    'numbness',
    'sunn',
    'tingling',
    'weight',
    'appetite',
    'bhook',
    'بھوک',
    'sleep',
    'neend',
    'نیند',
    'stress',
    'anxiety',
    'depression',
    'tired',
    'thakan',
    'تھکان',
  ];

  // Extract symptoms from current message
  const messageToAnalyze = (
    state.userMessageTranslated || state.userMessage
  ).toLowerCase();
  const newSymptoms = symptomKeywords.filter(kw =>
    messageToAnalyze.includes(kw.toLowerCase())
  );

  // Also check for negative responses to track ruled-out symptoms
  const negativeIndicators = [
    'no',
    'nahi',
    'نہیں',
    'not',
    "don't",
    "haven't",
    'never',
  ];
  const isNegativeResponse = negativeIndicators.some(neg =>
    messageToAnalyze.includes(neg)
  );

  const allSymptoms = [
    ...new Set([...currentState.identifiedSymptoms, ...newSymptoms]),
  ];

  // Initialize diseases
  let diseases = currentState.potentialDiseases;
  let eliminationRecord = {
    turn: conversationTurn,
    eliminated: [] as string[],
    reason: '',
    remainingCount: 0,
  };

  if (conversationTurn <= 1 || diseases.length === 0) {
    // INITIAL DISEASE IDENTIFICATION - Start with ~50 diseases (optimized for speed)
    console.log(
      `   📊 Initial disease identification - gathering ${INITIAL_DISEASE_COUNT} potential conditions...`
    );

    // Add diseases from RAG knowledge base FIRST (no LLM call needed)
    if (state.ragContext?.diseases) {
      for (const ragDisease of state.ragContext.diseases) {
        if (
          !diseases.find(d => d.name.toLowerCase() === ragDisease.toLowerCase())
        ) {
          diseases.push({
            name: ragDisease,
            probability: 40 + Math.random() * 25, // 40-65% initial probability
            matchedSymptoms: allSymptoms,
            differentiatingSymptoms: [],
            severity: 'moderate',
          });
        }
      }
    }

    // Expand with common conditions based on symptoms (no LLM call)
    const commonConditionCategories =
      getCommonConditionsForSymptoms(allSymptoms);
    for (const condition of commonConditionCategories) {
      if (
        !diseases.find(d => d.name.toLowerCase() === condition.toLowerCase())
      ) {
        diseases.push({
          name: condition,
          probability: 30 + Math.random() * 20, // 30-50% probability
          matchedSymptoms: allSymptoms,
          differentiatingSymptoms: [],
          severity: 'moderate',
        });
      }
    }

    // Only call LLM if we don't have enough diseases yet (optimization)
    if (diseases.length < 15 && allSymptoms.length > 0) {
      const llmDiseases = await identifyDiseases(
        allSymptoms,
        state.ragContext?.context
      );

      for (const d of llmDiseases) {
        if (
          !diseases.find(
            existing => existing.name.toLowerCase() === d.name.toLowerCase()
          )
        ) {
          diseases.push({
            name: d.name,
            probability: d.probability,
            matchedSymptoms: allSymptoms,
            differentiatingSymptoms: [],
            severity: 'moderate' as SeverityLevel,
          });
        }
      }
    }

    // Ensure we have at least ~100 diseases
    while (diseases.length < INITIAL_DISEASE_COUNT) {
      const genericConditions = getGenericMedicalConditions(
        diseases.map(d => d.name)
      );
      for (const condition of genericConditions) {
        if (diseases.length >= INITIAL_DISEASE_COUNT) break;
        diseases.push({
          name: condition,
          probability: 15 + Math.random() * 15, // 15-30% probability
          matchedSymptoms: [],
          differentiatingSymptoms: [],
          severity: 'moderate',
        });
      }
    }

    console.log(
      `   🎯 Identified ${diseases.length} initial potential conditions`
    );
  } else {
    // PROGRESSIVE DISEASE NARROWING - Eliminate based on responses
    console.log('   📉 Narrowing down disease list based on response...');

    const previousDiseaseCount = diseases.length;

    if (isNegativeResponse) {
      // Patient said NO to a symptom - eliminate diseases that REQUIRE this symptom
      const lastQuestion = currentState.narrowingQuestions[0];
      if (lastQuestion?.targetSymptom) {
        const symptomToRuleOut = lastQuestion.targetSymptom;

        // Eliminate diseases where this symptom is critical
        const diseasesToEliminate = diseases.filter(d => {
          const requiresSymptom =
            d.differentiatingSymptoms.some(s =>
              s.toLowerCase().includes(symptomToRuleOut.toLowerCase())
            ) || lastQuestion.targetDiseases.includes(d.name);
          return requiresSymptom;
        });

        eliminationRecord.eliminated = diseasesToEliminate.map(d => d.name);
        eliminationRecord.reason = `Patient denied symptom: ${symptomToRuleOut}`;

        diseases = diseases.filter(
          d => !eliminationRecord.eliminated.includes(d.name)
        );

        // Decrease probability for remaining diseases that might be associated
        diseases = diseases.map(d => ({
          ...d,
          probability: Math.max(d.probability - 3, 10),
        }));
      }
    } else {
      // Patient confirmed symptom - increase relevant disease probabilities
      const matchingDiseases = diseases.filter(d =>
        newSymptoms.some(
          s =>
            d.name.toLowerCase().includes(s) ||
            d.matchedSymptoms.some(ms => ms.toLowerCase().includes(s))
        )
      );

      diseases = diseases.map(d => {
        const isMatch = matchingDiseases.includes(d);
        return {
          ...d,
          probability: isMatch
            ? Math.min(d.probability + 8, 95)
            : Math.max(d.probability - 3, 5),
          matchedSymptoms: isMatch
            ? [...new Set([...d.matchedSymptoms, ...newSymptoms])]
            : d.matchedSymptoms,
        };
      });

      // Eliminate lowest probability diseases to maintain narrowing
      const eliminationThreshold = Math.max(10, 30 - conversationTurn * 2);
      const lowProbDiseases = diseases.filter(
        d => d.probability < eliminationThreshold
      );

      if (lowProbDiseases.length > 0 && diseases.length > 10) {
        const toEliminate = lowProbDiseases.slice(
          0,
          Math.ceil(lowProbDiseases.length * 0.3)
        );
        eliminationRecord.eliminated = toEliminate.map(d => d.name);
        eliminationRecord.reason = `Low probability (< ${eliminationThreshold}%) after symptom confirmation`;
        diseases = diseases.filter(
          d => !eliminationRecord.eliminated.includes(d.name)
        );
      }
    }

    // Sort by probability and keep tracking
    diseases = diseases.sort((a, b) => b.probability - a.probability);

    // Gradually narrow - more aggressive as turns progress
    const maxToKeep = Math.max(
      MIN_DISEASES_FOR_COMPLETION,
      INITIAL_DISEASE_COUNT - conversationTurn * 5 // Eliminate ~5 per turn on average
    );

    if (diseases.length > maxToKeep) {
      const eliminated = diseases.slice(maxToKeep);
      eliminationRecord.eliminated = [
        ...eliminationRecord.eliminated,
        ...eliminated.map(d => d.name),
      ];
      eliminationRecord.reason += ` + Bottom ${eliminated.length} diseases eliminated`;
      diseases = diseases.slice(0, maxToKeep);
    }

    eliminationRecord.remainingCount = diseases.length;

    console.log(
      `   📊 Narrowed from ${previousDiseaseCount} to ${diseases.length} conditions`
    );
    if (eliminationRecord.eliminated.length > 0) {
      console.log(
        `   ❌ Eliminated: ${eliminationRecord.eliminated.slice(0, 5).join(', ')}${eliminationRecord.eliminated.length > 5 ? '...' : ''}`
      );
    }
  }

  // Calculate CONFIDENCE SCORE based on disease narrowing
  // Confidence = (Initial Diseases - Current Diseases) / Initial Diseases * 100
  const diseaseReductionRatio =
    (INITIAL_DISEASE_COUNT - diseases.length) / INITIAL_DISEASE_COUNT;
  const symptomContribution = Math.min(allSymptoms.length * 4, 25); // Max 25% from symptoms
  const turnContribution = Math.min(conversationTurn * 3, 25); // Max 25% from turns (faster confidence growth)
  const topDiseaseProbability = diseases[0]?.probability || 30;

  let confidenceScore = Math.min(
    diseaseReductionRatio * 50 + // 50% weight from disease elimination
      symptomContribution +
      turnContribution +
      topDiseaseProbability * 0.15, // 15% from top disease probability
    95 // Cap at 95%
  );

  // Only allow high confidence after minimum turns
  if (conversationTurn < MIN_CONVERSATION_TURNS) {
    confidenceScore = Math.min(confidenceScore, 85);
  }

  // Generate simple narrowing questions WITHOUT extra LLM call (for speed)
  // The actual question text will be generated by the reasoning agent
  const topDiseases = diseases.slice(0, 5).map(d => d.name);
  const narrowingQuestions = topDiseases.map((disease, i) => ({
    question: `Ask about ${disease} differentiating symptoms`,
    questionUrdu: `${disease} کی علامات کے بارے میں پوچھیں`,
    targetSymptom: disease.toLowerCase().split(' ')[0],
    targetDiseases: [disease],
    priority: i + 1,
  }));

  const diagnosisState: DiagnosisState = {
    potentialDiseases: diseases,
    confidenceScore: Math.round(confidenceScore),
    identifiedSymptoms: allSymptoms,
    ruledOutDiseases: [
      ...currentState.ruledOutDiseases,
      ...eliminationRecord.eliminated,
    ],
    narrowingQuestions,
  };

  console.log(`   🎯 Confidence: ${diagnosisState.confidenceScore}%`);
  console.log(`   🦠 Remaining diseases: ${diseases.length}`);
  console.log(
    `   🔝 Top conditions: ${diseases
      .slice(0, 3)
      .map(d => `${d.name}(${Math.round(d.probability)}%)`)
      .join(', ')}`
  );
  console.log(
    `   💬 Turn: ${conversationTurn} / Min: ${MIN_CONVERSATION_TURNS}`
  );

  const agentAction = {
    agentName: 'DiseaseIdentificationAgent',
    action: 'identify_and_narrow',
    result: {
      initialDiseaseCount: INITIAL_DISEASE_COUNT,
      currentDiseaseCount: diseases.length,
      confidence: diagnosisState.confidenceScore,
      symptoms: allSymptoms,
      eliminatedThisTurn: eliminationRecord.eliminated.length,
      topDiseases: diseases
        .slice(0, 5)
        .map(d => ({ name: d.name, probability: d.probability })),
    },
    timestamp: new Date().toISOString(),
  };

  return {
    diagnosisState,
    conversationTurn: conversationTurn + 1,
    agentActions: [agentAction],
  };
}

/**
 * Get common medical conditions based on reported symptoms
 */
function getCommonConditionsForSymptoms(symptoms: string[]): string[] {
  const symptomText = symptoms.join(' ').toLowerCase();
  const conditions: string[] = [];

  // Respiratory conditions
  if (
    symptomText.includes('cough') ||
    symptomText.includes('breathing') ||
    symptomText.includes('saans')
  ) {
    conditions.push(
      'Common Cold',
      'Bronchitis',
      'Pneumonia',
      'Asthma',
      'COPD',
      'Allergic Rhinitis',
      'Sinusitis',
      'Upper Respiratory Infection',
      'Tuberculosis',
      'Lung Cancer',
      'Pulmonary Embolism'
    );
  }

  // Cardiovascular conditions
  if (
    symptomText.includes('chest') ||
    symptomText.includes('heart') ||
    symptomText.includes('dil')
  ) {
    conditions.push(
      'Angina',
      'Heart Attack',
      'Arrhythmia',
      'Heart Failure',
      'Hypertension',
      'Pericarditis',
      'Coronary Artery Disease',
      'Cardiomyopathy',
      'Aortic Dissection',
      'Myocarditis'
    );
  }

  // Gastrointestinal conditions
  if (
    symptomText.includes('stomach') ||
    symptomText.includes('pait') ||
    symptomText.includes('nausea')
  ) {
    conditions.push(
      'Gastritis',
      'GERD',
      'Peptic Ulcer',
      'IBS',
      'Gastroenteritis',
      'Appendicitis',
      'Gallstones',
      'Pancreatitis',
      "Crohn's Disease",
      'Ulcerative Colitis',
      'Liver Disease',
      'Food Poisoning'
    );
  }

  // Neurological conditions
  if (
    symptomText.includes('head') ||
    symptomText.includes('dizz') ||
    symptomText.includes('chakkar')
  ) {
    conditions.push(
      'Migraine',
      'Tension Headache',
      'Cluster Headache',
      'Vertigo',
      'Meningitis',
      'Brain Tumor',
      'Stroke',
      'TIA',
      'Epilepsy',
      'Multiple Sclerosis',
      "Parkinson's Disease"
    );
  }

  // Musculoskeletal conditions
  if (
    symptomText.includes('joint') ||
    symptomText.includes('muscle') ||
    symptomText.includes('back')
  ) {
    conditions.push(
      'Osteoarthritis',
      'Rheumatoid Arthritis',
      'Gout',
      'Fibromyalgia',
      'Muscle Strain',
      'Herniated Disc',
      'Sciatica',
      'Osteoporosis',
      'Lupus',
      'Ankylosing Spondylitis'
    );
  }

  // Infectious diseases
  if (symptomText.includes('fever') || symptomText.includes('bukhar')) {
    conditions.push(
      'Influenza',
      'COVID-19',
      'Dengue Fever',
      'Typhoid',
      'Malaria',
      'Sepsis',
      'Viral Infection',
      'Bacterial Infection',
      'UTI'
    );
  }

  // Dermatological conditions
  if (
    symptomText.includes('skin') ||
    symptomText.includes('rash') ||
    symptomText.includes('itching')
  ) {
    conditions.push(
      'Eczema',
      'Psoriasis',
      'Dermatitis',
      'Hives',
      'Fungal Infection',
      'Scabies',
      'Shingles',
      'Cellulitis'
    );
  }

  // Mental health conditions
  if (
    symptomText.includes('stress') ||
    symptomText.includes('anxiety') ||
    symptomText.includes('sleep')
  ) {
    conditions.push(
      'Generalized Anxiety Disorder',
      'Depression',
      'Insomnia',
      'Panic Disorder',
      'PTSD',
      'Chronic Fatigue Syndrome'
    );
  }

  return [...new Set(conditions)];
}

/**
 * Get generic medical conditions to fill disease pool
 */
function getGenericMedicalConditions(existingConditions: string[]): string[] {
  const allConditions = [
    // General medicine
    'Hypertension',
    'Diabetes Type 2',
    'Diabetes Type 1',
    'Anemia',
    'Thyroid Disorder',
    'Hyperthyroidism',
    'Hypothyroidism',
    'Vitamin D Deficiency',
    'Vitamin B12 Deficiency',
    'Iron Deficiency',
    'Dehydration',
    'Electrolyte Imbalance',
    // Respiratory
    'Chronic Bronchitis',
    'Emphysema',
    'Pleural Effusion',
    'Pneumothorax',
    'Sleep Apnea',
    // Cardiovascular
    'Peripheral Artery Disease',
    'Deep Vein Thrombosis',
    'Varicose Veins',
    'Atrial Fibrillation',
    // GI
    'Celiac Disease',
    'Diverticulitis',
    'Hepatitis',
    'Cirrhosis',
    'Hemorrhoids',
    // Neurological
    'Neuropathy',
    "Alzheimer's Disease",
    'Dementia',
    "Bell's Palsy",
    'Trigeminal Neuralgia',
    // Kidney/Urinary
    'Kidney Stones',
    'Chronic Kidney Disease',
    'Acute Kidney Injury',
    'Prostate Enlargement',
    // Endocrine
    "Addison's Disease",
    "Cushing's Syndrome",
    'PCOS',
    'Metabolic Syndrome',
    // Autoimmune
    "Sjogren's Syndrome",
    "Hashimoto's Thyroiditis",
    "Graves' Disease",
    'Vasculitis',
    // Infectious
    'Hepatitis B',
    'Hepatitis C',
    'HIV/AIDS',
    'Lyme Disease',
    'Tuberculosis',
    // Cancer screening
    'Lymphoma',
    'Leukemia',
    'Colon Cancer',
    'Breast Cancer',
    'Prostate Cancer',
    // Other
    'Chronic Pain Syndrome',
    'Restless Leg Syndrome',
    "Meniere's Disease",
  ];

  return allConditions.filter(c => !existingConditions.includes(c));
}

/**
 * Sub-Agent 5: Reasoning and response generation
 * Enhanced to enforce minimum conversation turns (15-20 questions)
 */
async function reasoningNode(state: InterviewAgentState) {
  console.log('\n🧠 [Reasoning Agent] Generating clinical response...');

  const { diagnosisState, conversationTurn } = state;

  // Check interview completion criteria - ENFORCING MINIMUM TURNS
  const hasMinimumTurns = conversationTurn >= MIN_CONVERSATION_TURNS;
  const hasHighConfidence =
    diagnosisState.confidenceScore >= CONFIDENCE_THRESHOLD;
  const hasNarrowedDiseases =
    diagnosisState.potentialDiseases.length <= MIN_DISEASES_FOR_COMPLETION &&
    diagnosisState.confidenceScore >= MIN_CONFIDENCE_FOR_DISEASE_COMPLETION;
  const maxTurnsReached = conversationTurn >= MAX_CONVERSATION_TURNS;

  // Interview is ready ONLY if minimum turns met AND (high confidence OR narrowed diseases OR max turns)
  const isReadyForDiagnosis =
    hasMinimumTurns &&
    (hasHighConfidence || hasNarrowedDiseases || maxTurnsReached);

  console.log(`   📊 Interview completion check:`);
  console.log(
    `      - Minimum turns (${MIN_CONVERSATION_TURNS}): ${conversationTurn}/${MIN_CONVERSATION_TURNS} - ${hasMinimumTurns ? '✅' : '❌'}`
  );
  console.log(
    `      - Confidence: ${diagnosisState.confidenceScore}% (threshold: ${CONFIDENCE_THRESHOLD}%) - ${hasHighConfidence ? '✅' : '❌'}`
  );
  console.log(
    `      - Disease count: ${diagnosisState.potentialDiseases.length} (min: ${MIN_DISEASES_FOR_COMPLETION}) - ${hasNarrowedDiseases ? '✅' : '❌'}`
  );
  console.log(
    `      - Max turns (${MAX_CONVERSATION_TURNS}): ${conversationTurn}/${MAX_CONVERSATION_TURNS} - ${maxTurnsReached ? '✅' : '❌'}`
  );
  console.log(
    `      - Ready for diagnosis: ${isReadyForDiagnosis ? '✅ YES' : '❌ NO - Continue questioning'}`
  );

  // Build conversation history
  const conversationHistory = state.conversationHistory.map(m => ({
    role: m.role,
    content: m.content,
  }));

  // Generate response with context about remaining questions
  const remainingToMinimum = Math.max(
    0,
    MIN_CONVERSATION_TURNS - conversationTurn
  );
  const progressInfo = !isReadyForDiagnosis
    ? `\n\nProgress: ${conversationTurn} questions asked, ${remainingToMinimum > 0 ? `at least ${remainingToMinimum} more needed` : 'nearing conclusion'}.`
    : '';

  const response = await generateClinicalResponse({
    userMessage: state.userMessage,
    medicalContext: state.ragContext?.context || '',
    patientHistory: state.medicalHistory,
    conversationHistory,
    potentialDiseases: diagnosisState.potentialDiseases
      .slice(0, 8)
      .map(d => d.name),
    confidenceScore: diagnosisState.confidenceScore,
    identifiedSymptoms: diagnosisState.identifiedSymptoms,
    isReadyForDiagnosis,
  });

  // Determine severity
  let severity: SeverityLevel = 'moderate';
  const emergencyKeywords = [
    'chest pain',
    'breathing',
    'unconscious',
    'severe bleeding',
    'stroke',
    'heart',
  ];
  if (
    emergencyKeywords.some(k => state.userMessage.toLowerCase().includes(k))
  ) {
    severity = 'critical';
  } else if (diagnosisState.confidenceScore >= 70) {
    severity = diagnosisState.potentialDiseases[0]?.severity || 'moderate';
  }

  // Update conversation history
  const newMessages: ChatMessage[] = [
    {
      role: 'user',
      content: state.userMessage,
      timestamp: new Date().toISOString(),
    },
    {
      role: 'assistant',
      content: response.content,
      timestamp: new Date().toISOString(),
      metadata: {
        urdu: response.urdu,
        severity: response.severity,
        confidence: response.confidenceLevel,
        diseaseCount: diagnosisState.potentialDiseases.length,
        turnNumber: conversationTurn,
        isNearingConclusion:
          hasMinimumTurns && diagnosisState.confidenceScore >= 80,
      },
    },
  ];

  const agentAction = {
    agentName: 'ReasoningAgent',
    action: isReadyForDiagnosis
      ? 'generate_diagnosis'
      : 'generate_narrowing_question',
    result: {
      confidence: response.confidenceLevel,
      isConfident: response.isConfident,
      remainingDiseases: diagnosisState.potentialDiseases.length,
      questionsAsked: conversationTurn,
      minimumQuestionsRequired: MIN_CONVERSATION_TURNS,
      isReadyForDiagnosis,
    },
    timestamp: new Date().toISOString(),
  };

  // Normalize confidence level
  let normalizedConfidence =
    response.confidenceLevel || diagnosisState.confidenceScore;
  if (normalizedConfidence > 0 && normalizedConfidence <= 1) {
    normalizedConfidence = Math.round(normalizedConfidence * 100);
  }
  normalizedConfidence = Math.max(
    0,
    Math.min(100, Math.round(normalizedConfidence))
  );

  return {
    aiResponse: response.content,
    aiResponseUrdu: response.urdu,
    severity: severity,
    isInterviewComplete:
      (response.isConfident && isReadyForDiagnosis) || isReadyForDiagnosis,
    shouldGenerateReport:
      (response.isConfident && isReadyForDiagnosis) || isReadyForDiagnosis,
    conversationHistory: newMessages,
    diagnosisState: {
      ...diagnosisState,
      confidenceScore: normalizedConfidence,
    },
    agentActions: [agentAction],
  };
}

/**
 * Conditional: Check if we should continue or generate report
 */
function shouldContinueOrReport(
  state: InterviewAgentState
): 'continue' | 'complete' {
  if (state.isInterviewComplete || state.shouldGenerateReport) {
    return 'complete';
  }
  return 'continue';
}

/**
 * Build the Interview Agent Graph
 * Sequential execution for stability
 */
export function createInterviewAgent() {
  const workflow = new StateGraph(InterviewAgentStateSchema)
    // Add nodes (sub-agents)
    .addNode('translate', translateNode)
    .addNode('rag_retrieval', ragRetrievalNode)
    .addNode('history_fetch', historyFetchNode)
    .addNode('disease_identification', diseaseIdentificationNode)
    .addNode('reasoning', reasoningNode)

    // Define flow - Sequential to avoid concurrent state update issues
    .addEdge('__start__', 'translate')
    .addEdge('translate', 'rag_retrieval')
    .addEdge('rag_retrieval', 'history_fetch')
    .addEdge('history_fetch', 'disease_identification')
    .addEdge('disease_identification', 'reasoning')
    .addEdge('reasoning', '__end__');

  return workflow.compile();
}

/**
 * Run single interview step
 */
export async function runInterviewStep(
  patientId: string,
  sessionId: string,
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
  diagnosisState?: DiagnosisState,
  conversationTurn: number = 0
): Promise<{
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
}> {
  const agent = createInterviewAgent();

  const initialDiagnosisState: DiagnosisState = diagnosisState || {
    potentialDiseases: [],
    confidenceScore: 30,
    identifiedSymptoms: [],
    ruledOutDiseases: [],
    narrowingQuestions: [],
  };

  const result = await agent.invoke({
    patientId,
    sessionId,
    userMessage,
    userMessageTranslated: '',
    patientInfo: null,
    medicalHistory: '',
    ragContext: null,
    queryEmbedding: [],
    conversationHistory,
    conversationTurn,
    diagnosisState: initialDiagnosisState,
    aiResponse: '',
    aiResponseUrdu: '',
    severity: 'initial' as SeverityLevel,
    isInterviewComplete: false,
    shouldGenerateReport: false,
    agentActions: [],
  });

  return {
    response: result.aiResponse,
    responseUrdu: result.aiResponseUrdu,
    severity: result.severity,
    confidenceLevel: result.diagnosisState.confidenceScore,
    identifiedSymptoms: result.diagnosisState.identifiedSymptoms,
    potentialDiseases: result.diagnosisState.potentialDiseases.map(d => ({
      name: d.name,
      probability: d.probability,
    })),
    isComplete: result.isInterviewComplete,
    shouldGenerateReport: result.shouldGenerateReport,
    conversationHistory: result.conversationHistory,
    diagnosisState: result.diagnosisState,
    agentActions: result.agentActions,
  };
}

export {
  MAX_CONVERSATION_TURNS,
  MIN_CONVERSATION_TURNS,
  CONFIDENCE_THRESHOLD,
  MIN_DISEASES_FOR_COMPLETION,
  INITIAL_DISEASE_COUNT,
};
