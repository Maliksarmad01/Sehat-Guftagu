/**
 * Centralized Department Constants
 * Use these constants across the entire application for consistency
 */

import {
  Stethoscope,
  Heart,
  Brain,
  Bone,
  Eye,
  Baby,
  Smile,
  Activity,
  LucideIcon,
} from 'lucide-react';

// Department IDs (used as values in database and forms)
export const DEPARTMENT_IDS = {
  ALL: 'all',
  GENERAL_MEDICINE: 'general_medicine',
  CARDIOLOGY: 'cardiology',
  NEUROLOGY: 'neurology',
  ORTHOPEDICS: 'orthopedics',
  PEDIATRICS: 'pediatrics',
  DERMATOLOGY: 'dermatology',
  PSYCHIATRY: 'psychiatry',
  GYNECOLOGY: 'gynecology',
  OPHTHALMOLOGY: 'ophthalmology',
  ENT: 'ent',
  GASTROENTEROLOGY: 'gastroenterology',
  PULMONOLOGY: 'pulmonology',
  EMERGENCY: 'emergency',
} as const;

export type DepartmentId = (typeof DEPARTMENT_IDS)[keyof typeof DEPARTMENT_IDS];

// Department information with display names, icons, and colors
export interface DepartmentInfo {
  id: DepartmentId;
  name: string;
  shortName: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  textColor: string;
}

export const DEPARTMENTS: DepartmentInfo[] = [
  {
    id: DEPARTMENT_IDS.ALL,
    name: 'All Departments',
    shortName: 'All',
    icon: Activity,
    color: '#6366f1',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
  },
  {
    id: DEPARTMENT_IDS.GENERAL_MEDICINE,
    name: 'General Medicine',
    shortName: 'General',
    icon: Stethoscope,
    color: '#6366f1',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
  },
  {
    id: DEPARTMENT_IDS.CARDIOLOGY,
    name: 'Cardiology',
    shortName: 'Cardio',
    icon: Heart,
    color: '#ef4444',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
  },
  {
    id: DEPARTMENT_IDS.NEUROLOGY,
    name: 'Neurology',
    shortName: 'Neuro',
    icon: Brain,
    color: '#8b5cf6',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
  },
  {
    id: DEPARTMENT_IDS.ORTHOPEDICS,
    name: 'Orthopedics',
    shortName: 'Ortho',
    icon: Bone,
    color: '#f97316',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
  },
  {
    id: DEPARTMENT_IDS.PEDIATRICS,
    name: 'Pediatrics',
    shortName: 'Pedia',
    icon: Baby,
    color: '#ec4899',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-700',
  },
  {
    id: DEPARTMENT_IDS.DERMATOLOGY,
    name: 'Dermatology',
    shortName: 'Derma',
    icon: Smile,
    color: '#14b8a6',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700',
  },
  {
    id: DEPARTMENT_IDS.PSYCHIATRY,
    name: 'Psychiatry',
    shortName: 'Psych',
    icon: Brain,
    color: '#6366f1',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
  },
  {
    id: DEPARTMENT_IDS.GYNECOLOGY,
    name: 'Gynecology',
    shortName: 'Gyne',
    icon: Heart,
    color: '#ec4899',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-700',
  },
  {
    id: DEPARTMENT_IDS.OPHTHALMOLOGY,
    name: 'Ophthalmology',
    shortName: 'Eye',
    icon: Eye,
    color: '#0ea5e9',
    bgColor: 'bg-sky-50',
    textColor: 'text-sky-700',
  },
  {
    id: DEPARTMENT_IDS.ENT,
    name: 'ENT (Ear, Nose, Throat)',
    shortName: 'ENT',
    icon: Activity,
    color: '#22c55e',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
  },
  {
    id: DEPARTMENT_IDS.GASTROENTEROLOGY,
    name: 'Gastroenterology',
    shortName: 'Gastro',
    icon: Activity,
    color: '#eab308',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
  },
  {
    id: DEPARTMENT_IDS.PULMONOLOGY,
    name: 'Pulmonology',
    shortName: 'Pulmo',
    icon: Activity,
    color: '#0ea5e9',
    bgColor: 'bg-sky-50',
    textColor: 'text-sky-700',
  },
  {
    id: DEPARTMENT_IDS.EMERGENCY,
    name: 'Emergency',
    shortName: 'ER',
    icon: Activity,
    color: '#dc2626',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
  },
];

// Get department info by ID
export const getDepartmentById = (id: string): DepartmentInfo => {
  const normalized =
    id?.toLowerCase().replace(/\s+/g, '_') || DEPARTMENT_IDS.GENERAL_MEDICINE;
  return (
    DEPARTMENTS.find(d => d.id === normalized) ||
    DEPARTMENTS.find(d => d.id === DEPARTMENT_IDS.GENERAL_MEDICINE)!
  );
};

// Get departments for select dropdown (excluding 'all')
export const getDepartmentOptions = () => {
  return DEPARTMENTS.filter(d => d.id !== DEPARTMENT_IDS.ALL);
};

// Get all departments including 'all' option (for filters)
export const getDepartmentFilterOptions = () => {
  return DEPARTMENTS;
};

// Normalize department value (handle legacy values)
export const normalizeDepartmentId = (
  value: string | null | undefined
): DepartmentId => {
  if (!value) return DEPARTMENT_IDS.GENERAL_MEDICINE;

  const normalized = value.toLowerCase().replace(/\s+/g, '_');

  // Handle legacy mappings
  const legacyMappings: Record<string, DepartmentId> = {
    general: DEPARTMENT_IDS.GENERAL_MEDICINE,
    'general medicine': DEPARTMENT_IDS.GENERAL_MEDICINE,
    cardio: DEPARTMENT_IDS.CARDIOLOGY,
    neuro: DEPARTMENT_IDS.NEUROLOGY,
    ortho: DEPARTMENT_IDS.ORTHOPEDICS,
    pedia: DEPARTMENT_IDS.PEDIATRICS,
    derma: DEPARTMENT_IDS.DERMATOLOGY,
    psych: DEPARTMENT_IDS.PSYCHIATRY,
    gyne: DEPARTMENT_IDS.GYNECOLOGY,
    eye: DEPARTMENT_IDS.OPHTHALMOLOGY,
    gastro: DEPARTMENT_IDS.GASTROENTEROLOGY,
    pulmo: DEPARTMENT_IDS.PULMONOLOGY,
    er: DEPARTMENT_IDS.EMERGENCY,
  };

  if (legacyMappings[normalized]) {
    return legacyMappings[normalized];
  }

  // Check if it's already a valid department ID
  const found = DEPARTMENTS.find(d => d.id === normalized);
  if (found) return found.id;

  return DEPARTMENT_IDS.GENERAL_MEDICINE;
};

// Department keywords for auto-assignment (used by Documentation Agent)
export const DEPARTMENT_KEYWORDS: Record<DepartmentId, string[]> = {
  [DEPARTMENT_IDS.ALL]: [],
  [DEPARTMENT_IDS.CARDIOLOGY]: [
    'heart',
    'chest pain',
    'cardiac',
    'blood pressure',
    'hypertension',
    'palpitation',
    'angina',
    'arrhythmia',
    'coronary',
  ],
  [DEPARTMENT_IDS.NEUROLOGY]: [
    'headache',
    'migraine',
    'dizziness',
    'stroke',
    'seizure',
    'numbness',
    'brain',
    'paralysis',
    'tremor',
  ],
  [DEPARTMENT_IDS.GASTROENTEROLOGY]: [
    'stomach',
    'abdominal',
    'nausea',
    'vomiting',
    'diarrhea',
    'constipation',
    'liver',
    'gastric',
    'digestive',
    'acid reflux',
  ],
  [DEPARTMENT_IDS.PULMONOLOGY]: [
    'breathing',
    'cough',
    'asthma',
    'bronchitis',
    'pneumonia',
    'respiratory',
    'lung',
    'wheezing',
    'shortness of breath',
  ],
  [DEPARTMENT_IDS.ORTHOPEDICS]: [
    'bone',
    'joint',
    'back pain',
    'fracture',
    'arthritis',
    'muscle',
    'spine',
    'knee',
    'hip',
    'shoulder',
  ],
  [DEPARTMENT_IDS.DERMATOLOGY]: [
    'skin',
    'rash',
    'itching',
    'allergy',
    'eczema',
    'acne',
    'psoriasis',
    'fungal',
    'hair loss',
  ],
  [DEPARTMENT_IDS.ENT]: [
    'ear',
    'nose',
    'throat',
    'sinus',
    'hearing',
    'tonsil',
    'voice',
    'nasal',
    'cold',
    'flu',
  ],
  [DEPARTMENT_IDS.OPHTHALMOLOGY]: [
    'eye',
    'vision',
    'sight',
    'cataract',
    'glaucoma',
    'blurry vision',
  ],
  [DEPARTMENT_IDS.PSYCHIATRY]: [
    'anxiety',
    'depression',
    'stress',
    'mental',
    'insomnia',
    'panic',
    'mood',
    'suicidal',
    'hallucination',
  ],
  [DEPARTMENT_IDS.PEDIATRICS]: [
    'child',
    'infant',
    'baby',
    'vaccination',
    'growth',
  ],
  [DEPARTMENT_IDS.GYNECOLOGY]: [
    'pregnancy',
    'menstrual',
    'uterus',
    'ovary',
    'breast',
    'period',
    'contraception',
    'menopause',
  ],
  [DEPARTMENT_IDS.GENERAL_MEDICINE]: [],
  [DEPARTMENT_IDS.EMERGENCY]: [
    'emergency',
    'accident',
    'trauma',
    'critical',
    'unconscious',
  ],
};

// Determine department based on symptoms and diagnosis
export const determineDepartment = (
  symptoms: string[],
  diseases: Array<{ name: string; probability: number }>
): DepartmentId => {
  const allTerms = [
    ...symptoms.map(s => s.toLowerCase()),
    ...diseases.map(d => d.name.toLowerCase()),
  ].join(' ');

  for (const [department, keywords] of Object.entries(DEPARTMENT_KEYWORDS)) {
    if (
      department === DEPARTMENT_IDS.ALL ||
      department === DEPARTMENT_IDS.GENERAL_MEDICINE
    )
      continue;
    if (keywords.some(kw => allTerms.includes(kw))) {
      return department as DepartmentId;
    }
  }

  return DEPARTMENT_IDS.GENERAL_MEDICINE;
};
