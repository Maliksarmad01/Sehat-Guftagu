/**
 * Safety Agent
 * Agent 4: Checks clinical reports for emergency indicators and triage labels
 *
 * Flow:
 * 1. Analyze SOAP report for red flags
 * 2. Check symptoms against emergency criteria
 * 3. Calculate urgency score
 * 4. Update triage label in database
 * 5. Flag for immediate attention if needed
 */

import { StateGraph } from '@langchain/langgraph';
import type { SafetyAgentState, SOAPReport, TriageLabel } from './types';
import { SafetyAgentStateSchema } from './types';
import { checkEmergencyFlags } from './llm-utils';
import prisma from '@/lib/prisma';

// Critical red flags that require immediate attention
const CRITICAL_RED_FLAGS = [
  // Cardiac emergencies
  {
    pattern: /chest\s*pain.*breath|breath.*chest\s*pain/i,
    flag: 'Potential cardiac emergency - chest pain with shortness of breath',
    score: 100,
  },
  {
    pattern: /heart\s*attack|myocardial\s*infarction/i,
    flag: 'Suspected heart attack',
    score: 100,
  },
  {
    pattern: /severe\s*chest\s*pain.*arm|arm.*severe\s*chest\s*pain/i,
    flag: 'Chest pain radiating to arm - cardiac concern',
    score: 95,
  },

  // Neurological emergencies
  {
    pattern: /sudden.*severe.*headache|worst\s*headache/i,
    flag: 'Sudden severe headache - possible stroke/hemorrhage',
    score: 95,
  },
  {
    pattern: /stroke|facial\s*droop|speech\s*difficulty/i,
    flag: 'Stroke warning signs',
    score: 100,
  },
  {
    pattern: /unconscious|loss\s*of\s*consciousness/i,
    flag: 'Loss of consciousness',
    score: 95,
  },
  { pattern: /seizure|convulsion/i, flag: 'Seizure activity', score: 85 },

  // Respiratory emergencies
  {
    pattern: /cannot\s*breath|can't\s*breath|severe.*breathing/i,
    flag: 'Severe respiratory distress',
    score: 100,
  },
  {
    pattern: /choking|airway\s*obstruction/i,
    flag: 'Airway emergency',
    score: 100,
  },
  {
    pattern: /cyanosis|blue\s*lips/i,
    flag: 'Cyanosis - oxygen deprivation',
    score: 95,
  },

  // Trauma/Bleeding
  {
    pattern: /severe\s*bleeding|heavy\s*bleeding|uncontrolled\s*bleeding/i,
    flag: 'Severe bleeding',
    score: 95,
  },
  {
    pattern: /head\s*injury.*confusion|trauma.*head/i,
    flag: 'Head trauma with altered consciousness',
    score: 90,
  },

  // Allergic reactions
  {
    pattern: /anaphylaxis|severe\s*allergic|throat\s*swelling/i,
    flag: 'Severe allergic reaction/Anaphylaxis',
    score: 100,
  },

  // Abdominal emergencies
  {
    pattern: /severe\s*abdominal\s*pain.*rigid/i,
    flag: 'Acute abdomen - possible peritonitis',
    score: 90,
  },

  // Psychiatric emergencies
  {
    pattern: /suicide|self\s*harm|want\s*to\s*die/i,
    flag: 'Suicide risk - immediate psychiatric evaluation needed',
    score: 100,
  },
];

// Urgent flags (not immediately life-threatening but need prompt attention)
const URGENT_FLAGS = [
  {
    pattern: /high\s*fever.*child|child.*high\s*fever/i,
    flag: 'High fever in child',
    score: 75,
  },
  {
    pattern: /fever.*39|39.*fever|fever.*40|40.*fever/i,
    flag: 'Very high fever (39-40°C)',
    score: 70,
  },
  {
    pattern: /blood\s*in\s*stool|rectal\s*bleeding/i,
    flag: 'GI bleeding',
    score: 75,
  },
  {
    pattern: /blood\s*in\s*urine|hematuria/i,
    flag: 'Blood in urine',
    score: 65,
  },
  {
    pattern: /sudden.*vision|vision.*loss/i,
    flag: 'Sudden vision changes',
    score: 80,
  },
  { pattern: /severe\s*dehydration/i, flag: 'Severe dehydration', score: 70 },
  {
    pattern: /diabetic.*ketoacidosis|dka/i,
    flag: 'Diabetic ketoacidosis',
    score: 85,
  },
  {
    pattern: /meningitis|stiff\s*neck.*fever/i,
    flag: 'Possible meningitis',
    score: 90,
  },
];

/**
 * Node: Analyze SOAP report for red flags
 */
async function analyzeRedFlags(state: SafetyAgentState) {
  console.log('\n🔴 [Safety Agent] Analyzing report for red flags...');

  if (!state.soapReport) {
    console.log('   ⚠️ No SOAP report to analyze');
    return { redFlagsDetected: [], emergencyIndicators: [] };
  }

  const redFlagsDetected: string[] = [];
  const emergencyIndicators: string[] = [];
  let maxScore = 0;

  // Combine all text from SOAP report for analysis
  const reportText = [
    state.soapReport.subjective.chiefComplaint,
    state.soapReport.subjective.symptoms.join(' '),
    state.soapReport.subjective.patientNarrative,
    state.soapReport.assessment.primaryDiagnosis,
    state.soapReport.assessment.aiAnalysis,
    ...state.soapReport.assessment.differentialDiagnosis,
  ]
    .join(' ')
    .toLowerCase();

  // Check critical red flags
  for (const { pattern, flag, score } of CRITICAL_RED_FLAGS) {
    if (pattern.test(reportText)) {
      redFlagsDetected.push(flag);
      emergencyIndicators.push(`CRITICAL: ${flag}`);
      maxScore = Math.max(maxScore, score);
      console.log(`   🚨 CRITICAL: ${flag}`);
    }
  }

  // Check urgent flags
  for (const { pattern, flag, score } of URGENT_FLAGS) {
    if (pattern.test(reportText)) {
      redFlagsDetected.push(flag);
      if (score >= 75) {
        emergencyIndicators.push(`URGENT: ${flag}`);
      }
      maxScore = Math.max(maxScore, score);
      console.log(`   ⚠️ URGENT: ${flag}`);
    }
  }

  // Add any red flags from SOAP report itself
  if (state.soapReport.assessment.redFlags) {
    redFlagsDetected.push(...state.soapReport.assessment.redFlags);
  }

  console.log(`   📊 Red flags detected: ${redFlagsDetected.length}`);
  console.log(`   🔥 Max severity score: ${maxScore}`);

  return {
    redFlagsDetected: [...new Set(redFlagsDetected)],
    emergencyIndicators: [...new Set(emergencyIndicators)],
    urgencyScore: maxScore,
  };
}

/**
 * Node: Use LLM to double-check emergency assessment
 */
async function llmSafetyCheck(state: SafetyAgentState) {
  console.log('\n🤖 [Safety Agent] LLM safety verification...');

  if (!state.soapReport) {
    return {};
  }

  // Only do LLM check if rule-based found potential issues
  // or if there are concerning symptoms
  if (state.redFlagsDetected.length === 0 && state.urgencyScore < 50) {
    console.log('   ✅ No concerning symptoms - skipping LLM check');
    return {};
  }

  try {
    const llmResult = await checkEmergencyFlags({
      symptoms: state.soapReport.subjective.symptoms,
      diagnosis: state.soapReport.assessment.primaryDiagnosis,
      patientAge: undefined, // Could be passed from patient info
    });

    // Merge LLM findings with rule-based findings
    const mergedFlags = [
      ...new Set([...state.redFlagsDetected, ...llmResult.redFlags]),
    ];

    const mergedEmergency = [
      ...new Set([
        ...state.emergencyIndicators,
        ...(llmResult.isEmergency ? ['LLM: Emergency condition detected'] : []),
      ]),
    ];

    console.log(`   🤖 LLM assessment: ${llmResult.triageLabel}`);
    console.log(`   📊 LLM urgency: ${llmResult.urgencyScore}`);

    return {
      redFlagsDetected: mergedFlags,
      emergencyIndicators: mergedEmergency,
      urgencyScore: Math.max(state.urgencyScore, llmResult.urgencyScore),
    };
  } catch (error) {
    console.error('   ❌ LLM safety check failed:', error);
    return {};
  }
}

/**
 * Node: Determine final triage label
 */
async function determineTriageLabel(state: SafetyAgentState) {
  console.log('\n🏷️ [Safety Agent] Determining triage label...');

  let triageLabel: TriageLabel = 'standard';
  const urgencyScore = state.urgencyScore;

  if (
    urgencyScore >= 90 ||
    state.emergencyIndicators.some(e => e.includes('CRITICAL'))
  ) {
    triageLabel = 'emergency';
  } else if (
    urgencyScore >= 70 ||
    state.emergencyIndicators.some(e => e.includes('URGENT'))
  ) {
    triageLabel = 'urgent';
  } else if (urgencyScore >= 40) {
    triageLabel = 'standard';
  } else {
    triageLabel = 'routine';
  }

  const requiresImmediateAttention = triageLabel === 'emergency';

  let safetyNotes = '';
  if (state.redFlagsDetected.length > 0) {
    safetyNotes = `Red flags detected: ${state.redFlagsDetected.join('; ')}. `;
  }
  if (requiresImmediateAttention) {
    safetyNotes += 'IMMEDIATE MEDICAL ATTENTION REQUIRED. ';
  }
  safetyNotes += `Urgency score: ${urgencyScore}/100.`;

  console.log(`   🏷️ Triage: ${triageLabel.toUpperCase()}`);
  console.log(`   🚨 Immediate attention: ${requiresImmediateAttention}`);

  return {
    triageLabel,
    requiresImmediateAttention,
    safetyNotes,
  };
}

/**
 * Node: Update report in database with safety assessment
 */
async function updateReportInDb(state: SafetyAgentState) {
  console.log('\n💾 [Safety Agent] Updating report with safety assessment...');

  if (!state.reportId) {
    console.log('   ⚠️ No report ID to update');
    return { updatedReport: false };
  }

  try {
    // Determine priority based on triage
    const priorityMapping: Record<TriageLabel, string> = {
      emergency: 'urgent',
      urgent: 'high',
      standard: 'normal',
      routine: 'low',
    };

    await prisma.sOAPReport.update({
      where: { id: state.reportId },
      data: {
        priority: priorityMapping[state.triageLabel],
        // Update assessment with red flags
        assessment: state.soapReport
          ? {
              ...(state.soapReport.assessment as any),
              redFlags: state.redFlagsDetected,
              safetyNotes: state.safetyNotes,
              urgencyScore: state.urgencyScore,
            }
          : undefined,
        updatedAt: new Date(),
      },
    });

    console.log(`   ✅ Report updated with triage: ${state.triageLabel}`);
    return { updatedReport: true };
  } catch (error) {
    console.error('   ❌ Failed to update report:', error);
    return { updatedReport: false };
  }
}

/**
 * Build the Safety Agent Graph
 */
export function createSafetyAgent() {
  const workflow = new StateGraph(SafetyAgentStateSchema)
    .addNode('analyze_red_flags', analyzeRedFlags)
    .addNode('llm_safety_check', llmSafetyCheck)
    .addNode('determine_triage', determineTriageLabel)
    .addNode('update_report', updateReportInDb)
    .addEdge('__start__', 'analyze_red_flags')
    .addEdge('analyze_red_flags', 'llm_safety_check')
    .addEdge('llm_safety_check', 'determine_triage')
    .addEdge('determine_triage', 'update_report')
    .addEdge('update_report', '__end__');

  return workflow.compile();
}

/**
 * Run safety check on a SOAP report
 */
export async function runSafetyCheck(params: {
  soapReport: SOAPReport;
  reportId: string;
}): Promise<{
  triageLabel: TriageLabel;
  redFlagsDetected: string[];
  emergencyIndicators: string[];
  urgencyScore: number;
  requiresImmediateAttention: boolean;
  safetyNotes: string;
  updatedReport: boolean;
}> {
  const agent = createSafetyAgent();

  const result = await agent.invoke({
    soapReport: params.soapReport,
    reportId: params.reportId,
    redFlagsDetected: [],
    emergencyIndicators: [],
    triageLabel: 'standard' as TriageLabel,
    urgencyScore: 0,
    safetyNotes: '',
    requiresImmediateAttention: false,
    updatedReport: false,
  });

  return {
    triageLabel: result.triageLabel,
    redFlagsDetected: result.redFlagsDetected,
    emergencyIndicators: result.emergencyIndicators,
    urgencyScore: result.urgencyScore,
    requiresImmediateAttention: result.requiresImmediateAttention,
    safetyNotes: result.safetyNotes,
    updatedReport: result.updatedReport,
  };
}

/**
 * Quick check for emergency symptoms (for real-time use during interview)
 */
export function quickEmergencyCheck(symptoms: string[]): {
  isEmergency: boolean;
  flags: string[];
} {
  const symptomText = symptoms.join(' ').toLowerCase();
  const flags: string[] = [];

  for (const { pattern, flag } of CRITICAL_RED_FLAGS) {
    if (pattern.test(symptomText)) {
      flags.push(flag);
    }
  }

  return {
    isEmergency: flags.length > 0,
    flags,
  };
}

export { CRITICAL_RED_FLAGS, URGENT_FLAGS };
