/**
 * LLM Guardrails for Clinical Interview System
 *
 * Safety filters and content moderation for medical AI responses
 * Ensures outputs are safe, appropriate, and medically responsible
 */

// ========== BLOCKED CONTENT PATTERNS ==========

// Medical advice that should NEVER be given by AI
const PROHIBITED_MEDICAL_ADVICE = [
  /prescri(be|ption)/i,
  /take\s+\d+\s*mg/i,
  /dosage/i,
  /medication\s+dose/i,
  /inject(ion)?/i,
  /stop\s+taking\s+your\s+(medication|medicine)/i,
  /you\s+(don't\s+)?need\s+to\s+see\s+a\s+doctor/i,
  /self[-\s]?medicate/i,
  /over[-\s]?the[-\s]?counter/i,
  /OTC\s+medication/i,
];

// Harmful or inappropriate content
const HARMFUL_CONTENT_PATTERNS = [
  /suicide\s+method/i,
  /how\s+to\s+kill/i,
  /self[-\s]?harm\s+technique/i,
  /dangerous\s+drug\s+combination/i,
  /overdose\s+amount/i,
  /illegal\s+drug/i,
  /recreational\s+drug\s+use/i,
];

// Claims that should be avoided
const OVERCONFIDENT_CLAIMS = [
  /you\s+(definitely|certainly)\s+have/i,
  /this\s+is\s+(definitely|certainly)/i,
  /100%\s+(sure|certain|confident)/i,
  /i\s+guarantee/i,
  /there('s)?\s+is\s+no\s+doubt/i,
  /without\s+a\s+doubt/i,
];

// ========== REQUIRED DISCLAIMERS ==========

const MEDICAL_DISCLAIMERS = {
  diagnosis:
    'This is a preliminary assessment and should be confirmed by a qualified healthcare professional.',
  emergency:
    'If you are experiencing a medical emergency, please call emergency services immediately.',
  medication:
    'Never start, stop, or change medication without consulting your doctor.',
  generalAdvice:
    'This information is for educational purposes only and is not a substitute for professional medical advice.',
};

// ========== SAFE RESPONSE TEMPLATES ==========

const SAFE_RESPONSES = {
  blockedContent:
    "I'm sorry, but I cannot provide that type of medical advice. Please consult with a qualified healthcare professional for specific medication or treatment recommendations.",

  emergencyDetected:
    "Based on what you've described, this could be a medical emergency. Please seek immediate medical attention or call emergency services (1122 or your local emergency number) right away.",

  uncertainDiagnosis:
    'Based on your symptoms, there are several possibilities that should be evaluated by a healthcare provider. I recommend scheduling an appointment for a proper examination.',

  selfHarmConcern:
    "I'm concerned about what you've shared. Please reach out to a mental health professional or call a crisis helpline. Your wellbeing is important, and help is available.",
};

// ========== GUARDRAIL FUNCTIONS ==========

export interface GuardrailResult {
  isAllowed: boolean;
  violations: string[];
  sanitizedContent?: string;
  requiresDisclaimer: boolean;
  disclaimerType?: keyof typeof MEDICAL_DISCLAIMERS;
  redirectResponse?: string;
}

/**
 * Check input message for harmful content before processing
 */
export function validateUserInput(message: string): GuardrailResult {
  const violations: string[] = [];

  // Check for self-harm indicators - prioritize safety
  const selfHarmPatterns = [
    /want\s+to\s+(die|end\s+it|kill\s+myself)/i,
    /suicid(e|al)/i,
    /self[-\s]?harm/i,
    /hurt\s+myself/i,
  ];

  for (const pattern of selfHarmPatterns) {
    if (pattern.test(message)) {
      return {
        isAllowed: true, // Still process but with care
        violations: ['self_harm_concern'],
        requiresDisclaimer: true,
        disclaimerType: 'emergency',
        redirectResponse: SAFE_RESPONSES.selfHarmConcern,
      };
    }
  }

  // Check for requests for harmful information
  for (const pattern of HARMFUL_CONTENT_PATTERNS) {
    if (pattern.test(message)) {
      violations.push('harmful_content_request');
    }
  }

  if (violations.length > 0) {
    return {
      isAllowed: false,
      violations,
      requiresDisclaimer: false,
      redirectResponse: SAFE_RESPONSES.blockedContent,
    };
  }

  return {
    isAllowed: true,
    violations: [],
    requiresDisclaimer: false,
  };
}

/**
 * Validate and sanitize AI response before sending to user
 */
export function validateAIResponse(response: string): GuardrailResult {
  const violations: string[] = [];
  let sanitizedContent = response;
  let requiresDisclaimer = false;
  let disclaimerType: keyof typeof MEDICAL_DISCLAIMERS = 'generalAdvice';

  // Check for prohibited medical advice
  for (const pattern of PROHIBITED_MEDICAL_ADVICE) {
    if (pattern.test(response)) {
      violations.push('prohibited_medical_advice');
      // Remove the problematic content
      sanitizedContent = sanitizedContent.replace(
        pattern,
        '[Please consult your doctor]'
      );
    }
  }

  // Check for overconfident claims
  for (const pattern of OVERCONFIDENT_CLAIMS) {
    if (pattern.test(response)) {
      violations.push('overconfident_claim');
      // Soften the language
      sanitizedContent = sanitizedContent
        .replace(/definitely|certainly/gi, 'likely')
        .replace(/100%/g, 'highly')
        .replace(/guarantee/gi, 'suggest')
        .replace(/no doubt/gi, 'likely');
    }
  }

  // Check if response mentions diagnosis - needs disclaimer
  if (/diagnos(is|e|ed)/i.test(response) || /condition/i.test(response)) {
    requiresDisclaimer = true;
    disclaimerType = 'diagnosis';
  }

  // Check for emergency indicators
  const emergencyPatterns = [
    /emergency/i,
    /immediate(ly)?\s+(medical\s+)?attention/i,
    /call\s+(911|1122|emergency)/i,
    /life[-\s]?threatening/i,
  ];

  for (const pattern of emergencyPatterns) {
    if (pattern.test(response)) {
      requiresDisclaimer = true;
      disclaimerType = 'emergency';
      break;
    }
  }

  return {
    isAllowed:
      violations.length === 0 ||
      violations.every(v => v === 'overconfident_claim'),
    violations,
    sanitizedContent,
    requiresDisclaimer,
    disclaimerType,
  };
}

/**
 * Add appropriate disclaimer to response
 */
export function addDisclaimer(
  response: string,
  disclaimerType: keyof typeof MEDICAL_DISCLAIMERS = 'generalAdvice'
): string {
  const disclaimer = MEDICAL_DISCLAIMERS[disclaimerType];

  // Check if disclaimer already exists
  if (response.includes(disclaimer)) {
    return response;
  }

  return `${response}\n\n⚠️ ${disclaimer}`;
}

/**
 * Check if response needs emergency escalation
 */
export function checkEmergencyEscalation(
  symptoms: string[],
  severity: string
): { needsEscalation: boolean; message: string } {
  const emergencySymptoms = [
    'chest pain',
    'difficulty breathing',
    'severe bleeding',
    'unconscious',
    'stroke',
    'heart attack',
    'seizure',
    'severe head injury',
    'anaphylaxis',
    'choking',
  ];

  const symptomText = symptoms.join(' ').toLowerCase();
  const hasEmergencySymptom = emergencySymptoms.some(s =>
    symptomText.includes(s)
  );

  if (hasEmergencySymptom || severity === 'critical') {
    return {
      needsEscalation: true,
      message: SAFE_RESPONSES.emergencyDetected,
    };
  }

  return {
    needsEscalation: false,
    message: '',
  };
}

/**
 * Validate confidence level is within acceptable range
 */
export function validateConfidenceLevel(confidence: number): number {
  // Never claim more than 95% confidence for AI diagnosis
  const maxAllowedConfidence = 95;
  const minConfidence = 0;

  // Normalize if decimal
  let normalizedConfidence = confidence;
  if (confidence > 0 && confidence <= 1) {
    normalizedConfidence = confidence * 100;
  }

  // Cap at maximum allowed
  return Math.max(
    minConfidence,
    Math.min(maxAllowedConfidence, Math.round(normalizedConfidence))
  );
}

/**
 * Get safe fallback response for blocked content
 */
export function getSafeResponse(type: keyof typeof SAFE_RESPONSES): string {
  return SAFE_RESPONSES[type];
}

/**
 * Full guardrail pipeline for interview responses
 */
export function applyGuardrails(
  userMessage: string,
  aiResponse: string,
  confidence: number,
  symptoms: string[],
  severity: string
): {
  processedResponse: string;
  processedConfidence: number;
  wasModified: boolean;
  emergencyEscalation: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  let wasModified = false;

  // 1. Validate user input
  const inputCheck = validateUserInput(userMessage);
  if (!inputCheck.isAllowed) {
    return {
      processedResponse:
        inputCheck.redirectResponse || SAFE_RESPONSES.blockedContent,
      processedConfidence: 0,
      wasModified: true,
      emergencyEscalation: false,
      violations: inputCheck.violations,
    };
  }

  // Handle self-harm with care
  if (inputCheck.violations.includes('self_harm_concern')) {
    violations.push('self_harm_concern');
    // Continue processing but flag it
  }

  // 2. Validate AI response
  const responseCheck = validateAIResponse(aiResponse);
  let processedResponse = responseCheck.sanitizedContent || aiResponse;

  if (responseCheck.violations.length > 0) {
    violations.push(...responseCheck.violations);
    wasModified = true;
  }

  // 3. Add disclaimer if needed
  if (responseCheck.requiresDisclaimer && responseCheck.disclaimerType) {
    processedResponse = addDisclaimer(
      processedResponse,
      responseCheck.disclaimerType
    );
    wasModified = true;
  }

  // 4. Validate and cap confidence
  const processedConfidence = validateConfidenceLevel(confidence);
  if (processedConfidence !== confidence) {
    wasModified = true;
  }

  // 5. Check for emergency escalation
  const emergencyCheck = checkEmergencyEscalation(symptoms, severity);

  return {
    processedResponse,
    processedConfidence,
    wasModified,
    emergencyEscalation: emergencyCheck.needsEscalation,
    violations,
  };
}

export { MEDICAL_DISCLAIMERS, SAFE_RESPONSES };
