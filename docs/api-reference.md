# API Reference

## Overview

Sehat Guftagu exposes RESTful API endpoints through Next.js API routes. All endpoints require authentication unless noted otherwise.

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

All protected routes require a valid session cookie from Better Auth.

```typescript
// Client-side auth check
import { authClient } from '@/lib/auth-client';
const session = await authClient.getSession();
```

---

## Endpoints

### Authentication

#### `POST /api/auth/[...all]`

Better Auth dynamic routes handling login, signup, logout, and session management.

**Handled Actions:**

- Sign up with email/password
- Sign in with email/password
- OAuth (Google)
- Sign out
- Session validation

---

### Clinical Interview

#### `POST /api/clinical-chat`

Process a clinical interview message through the AI agent pipeline.

**Request Body:**

```typescript
{
  message: string;           // User's message (can be Urdu or English)
  sessionId?: string;        // Optional session ID (auto-created if not provided)
  mode?: 'text' | 'voice';   // Interview mode
  generateReport?: boolean;  // Trigger SOAP generation when true
  conversationHistory?: ChatMessage[]; // Previous messages
}
```

**Response:**

```typescript
{
  success: boolean;
  response: string;           // AI response in English
  responseUrdu: string;       // AI response in Urdu
  sessionId: string;
  diagnosisState: {
    potentialDiseases: DiseaseCandidate[];
    confidenceScore: number;
    identifiedSymptoms: string[];
  };
  isComplete: boolean;        // Interview completion status
  conversationHistory: ChatMessage[];
  thinkingSteps: ThinkingStep[];  // Agent actions for UI

  // If generateReport was true:
  reportGenerated?: boolean;
  reportId?: string;
  department?: string;
  triageLabel?: 'emergency' | 'urgent' | 'standard' | 'routine';
}
```

#### `PUT /api/clinical-chat`

Create a new clinical session.

**Request Body:**

```typescript
{
  chiefComplaint?: string;   // Main symptom/reason for visit
}
```

**Response:**

```typescript
{
  success: boolean;
  session: {
    id: string;
    chiefComplaint: string;
    status: string;
    createdAt: string;
  }
}
```

---

### Medical History

#### `GET /api/medical-history`

Get patient's medical history.

**Response:**

```typescript
{
  success: boolean;
  history: {
    id: string;
    age: number;
    gender: string;
    bloodGroup: string;
    weight: number;
    height: number;
    familyHistory: Record<string, boolean>;
    chronicConditions: string[];
    currentMedications: string[];
    allergies: string[];
    pastSurgeries: string[];
    smokingStatus: string;
    alcoholConsumption: string;
    isComplete: boolean;
  } | null;
}
```

#### `POST /api/medical-history`

Submit/update medical history during onboarding.

**Request Body:**

```typescript
{
  message: string;           // User's response
  currentQuestion: number;   // Question index (0-14)
  collectedData: Record<string, any>;
  conversationHistory: ChatMessage[];
}
```

**Response:**

```typescript
{
  success: boolean;
  isComplete: boolean;
  currentQuestion: number;
  nextQuestion: string;
  nextQuestionUrdu: string;
  collectedData: Record<string, any>;
  conversationHistory: ChatMessage[];
}
```

---

### Reports

#### `GET /api/reports`

Get all reports for the current user.

**Query Parameters:**

- `status` - Filter by review status (pending, approved, rejected)

**Response:**

```typescript
{
  success: boolean;
  reports: SOAPReport[];
}
```

#### `GET /api/reports/[id]`

Get a specific report.

**Response:**

```typescript
{
  success: boolean;
  report: {
    id: string;
    sessionId: string;
    subjective: object;
    objective: object;
    assessment: object;
    plan: object;
    department: string;
    reviewStatus: string;
    prescription: string | null;
    doctorNotes: string | null;
    createdAt: string;
    patient: {
      name: string;
      email: string;
    }
  }
}
```

#### `POST /api/reports/[id]`

Generate PDF for a report.

**Response:**
Binary PDF file with headers:

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="SOAP_Report_<id>.pdf"
```

#### `PUT /api/reports/[id]`

Update report (doctor review).

**Request Body:**

```typescript
{
  action: 'approve' | 'reject' | 'request_changes';
  feedback?: string;
  starRating?: number;        // 1-5
  rejectionReason?: string;
  prescription?: string;
  doctorNotes?: string;
}
```

**Response:**

```typescript
{
  success: boolean;
  report: {
    id: string;
    reviewStatus: string;
    needsRegeneration: boolean;
    regeneratedReport?: SOAPReport;
  };
}
```

#### `GET /api/reports/[id]/prescription`

Download prescription PDF (for patients).

**Response:**
Binary PDF file with prescription details.

#### `POST /api/reports/[id]/prescription`

Generate prescription PDF (for doctors).

**Request Body:**

```typescript
{
  prescription: string; // Prescription text
}
```

**Response:**
Binary PDF file.

---

### Patient

#### `GET /api/patient/stats`

Get patient dashboard statistics.

**Response:**

```typescript
{
  success: boolean;
  stats: {
    totalSessions: number;
    completedSessions: number;
    pendingReports: number;
    approvedReports: number;
  }
  recentSessions: Array<{
    id: string;
    chiefComplaint: string;
    department: string;
    status: string;
    createdAt: string;
    reportId: string | null;
    hasPrescription: boolean;
  }>;
  prescriptions: Array<{
    id: string;
    diagnosis: string;
    prescription: string;
    doctorName: string;
    doctorSpecialization: string;
    createdAt: string;
  }>;
}
```

---

### Doctors

#### `GET /api/doctors`

Get doctors list (admin/system use).

**Response:**

```typescript
{
  success: boolean;
  doctors: Array<{
    id: string;
    name: string;
    specialization: string;
    department: string;
    hospital: string;
  }>;
}
```

#### `POST /api/doctors`

Create/update doctor profile.

**Request Body:**

```typescript
{
  fullName: string;
  phone: string;
  specialization: string;
  qualification: string;
  experience: number;
  licenseNumber: string;
  hospital: string;
  department: string;
  bio?: string;
}
```

#### `GET /api/doctors/check`

Check if current user is a doctor with complete profile.

**Response:**

```typescript
{
  isDoctor: boolean;
  isComplete: boolean;
  profile: DoctorProfile | null;
}
```

#### `GET /api/doctors/reports`

Get pending reports for doctor's department.

**Response:**

```typescript
{
  success: boolean;
  reports: Array<{
    id: string;
    patientName: string;
    chiefComplaint: string;
    department: string;
    priority: string;
    createdAt: string;
    assessment: object;
  }>;
}
```

#### `GET /api/doctors/stats`

Get doctor dashboard statistics.

**Response:**

```typescript
{
  success: boolean;
  stats: {
    pendingReports: number;
    reviewedToday: number;
    totalReviewed: number;
    avgRating: number;
  }
}
```

---

### User

#### `GET /api/user/role`

Get current user's role.

**Response:**

```typescript
{
  role: 'patient' | 'doctor';
  userId: string;
}
```

#### `PUT /api/user/role`

Update user role (during onboarding).

**Request Body:**

```typescript
{
  role: 'patient' | 'doctor';
}
```

#### `GET /api/user/role/check`

Check if user has completed role selection.

**Response:**

```typescript
{
  hasRole: boolean;
  role: string | null;
}
```

---

### Voice

#### `POST /api/voice/stt`

Convert speech to text using Groq Whisper.

**Request Body:**
FormData with audio file:

```typescript
{
  audio: File;              // Audio file (webm, mp3, wav)
  language?: string;        // 'ur' for Urdu, 'en' for English
}
```

**Response:**

```typescript
{
  success: boolean;
  text: string; // Transcribed text
  language: string; // Detected language
}
```

#### `POST /api/voice/tts`

Convert text to speech (with fallback chain).

**Request Body:**

```typescript
{
  text: string;             // Text to speak
  language?: string;        // 'ur' for Urdu, 'en' for English
  voiceId?: string;         // Optional specific voice
}
```

**Response:**
Binary audio file (MP3):

```
Content-Type: audio/mpeg
```

**Fallback Chain:**

1. ElevenLabs (Multilingual V2)
2. Uplift AI (Urdu specialized)
3. Groq Orpheus
4. Browser TTS (client-side fallback)

---

## Error Responses

All endpoints return consistent error format:

```typescript
{
  success: false;
  error: string;            // Error message
  code?: string;            // Error code
  details?: any;            // Additional details
}
```

**Common HTTP Status Codes:**

- `400` - Bad Request (invalid input)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

API routes are subject to rate limiting:

- 100 requests per minute per IP for general endpoints
- 20 requests per minute for LLM-intensive endpoints (`/clinical-chat`, `/voice/tts`)

---

## WebSocket Events (Future)

_Currently not implemented. All communication is REST-based._
