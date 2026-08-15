# Database Schema

## Overview

Sehat Guftagu uses PostgreSQL with Prisma ORM. The schema supports patient management, clinical sessions, SOAP reports, and doctor profiles.

## Entity Relationship Diagram

```
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│      User       │       │  ClinicalSession │       │   SOAPReport    │
├─────────────────┤       ├──────────────────┤       ├─────────────────┤
│ id (PK)         │───┐   │ id (PK)          │───────│ id (PK)         │
│ name            │   │   │ patientId (FK)   │       │ sessionId (FK)  │
│ email           │   │   │ chiefComplaint   │       │ patientId (FK)  │
│ role            │   │   │ conversationLog  │       │ subjective      │
│ createdAt       │   │   │ status           │       │ objective       │
│ ...             │   │   │ soapReport       │───────│ assessment      │
└────────┬────────┘   │   └──────────────────┘       │ plan            │
         │            │                               │ department      │
         │            │                               │ reviewStatus    │
    ┌────┴─────┐      └───────────────────────────────│ prescription    │
    │          │                                      └─────────────────┘
    ▼          ▼
┌─────────────────┐       ┌──────────────────┐
│ MedicalHistory  │       │  DoctorProfile   │
├─────────────────┤       ├──────────────────┤
│ id (PK)         │       │ id (PK)          │
│ patientId (FK)  │       │ doctorId (FK)    │
│ age             │       │ fullName         │
│ gender          │       │ specialization   │
│ bloodGroup      │       │ department       │
│ familyHistory   │       │ hospital         │
│ ...             │       │ licenseNumber    │
└─────────────────┘       └──────────────────┘
```

---

## Models

### User

The central user model supporting both patients and doctors.

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified Boolean?
  image         String?
  role          String    @default("patient")  // "patient" | "doctor"
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  sessions         Session[]
  accounts         Account[]
  medicalHistory   MedicalHistory?
  clinicalSessions ClinicalSession[]
  soapReports      SOAPReport[]
  doctorProfile    DoctorProfile?

  @@map("user")
}
```

**Key Fields:**

- `role`: Determines portal access ("patient" or "doctor")
- `medicalHistory`: One-to-one with MedicalHistory (patients only)
- `doctorProfile`: One-to-one with DoctorProfile (doctors only)

---

### Session

Better Auth session management.

```prisma
model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("session")
}
```

---

### Account

OAuth account linkage for social logins.

```prisma
model Account {
  id           String    @id @default(cuid())
  userId       String
  accountId    String
  providerId   String    // "google", "github", etc.
  accessToken  String?
  refreshToken String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope        String?
  idToken      String?
  password     String?   // For email/password accounts
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("account")
}
```

---

### MedicalHistory

Comprehensive medical history collected during patient onboarding.

```prisma
model MedicalHistory {
  id        String   @id @default(cuid())
  patientId String   @unique
  patient   User     @relation(fields: [patientId], references: [id], onDelete: Cascade)

  // Basic Info
  age           Int?
  gender        String?     // "male", "female", "other"
  bloodGroup    String?     // "A+", "A-", "B+", etc.
  weight        Float?      // in kg
  height        Float?      // in cm

  // Family History (JSON)
  familyHistory Json        @default("{}")
  // Example: {"diabetes": true, "heart_disease": false, "cancer": false}

  // Medical History
  chronicConditions   String[]  @default([])
  currentMedications  String[]  @default([])
  allergies           String[]  @default([])
  pastSurgeries       String[]  @default([])

  // Lifestyle
  smokingStatus       String?   // "never", "former", "current"
  alcoholConsumption  String?   // "never", "occasional", "regular"

  // Onboarding Data
  onboardingTranscript Json     @default("[]")  // Chat history

  // Status
  isComplete  Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("medical_history")
}
```

**Usage:**

```typescript
// Get patient history
const history = await prisma.medicalHistory.findUnique({
  where: { patientId: userId },
});

// Format for AI context
const formattedHistory = `
Age: ${history?.age || 'N/A'}
Gender: ${history?.gender || 'N/A'}
Blood Group: ${history?.bloodGroup || 'N/A'}
Chronic Conditions: ${history?.chronicConditions.join(', ') || 'None'}
Medications: ${history?.currentMedications.join(', ') || 'None'}
Allergies: ${history?.allergies.join(', ') || 'None'}
`;
```

---

### ClinicalSession

Individual clinical interview sessions.

```prisma
model ClinicalSession {
  id        String   @id @default(cuid())
  patientId String
  patient   User     @relation(fields: [patientId], references: [id], onDelete: Cascade)

  // Session Details
  chiefComplaint    String?    // Main symptom/reason for visit
  conversationLog   Json       @default("[]")  // Array of messages

  // AI Analysis
  identifiedSymptoms    String[]  @default([])
  redFlagsDetected      String[]  @default([])
  differentialDiagnosis Json      @default("[]")
  confidenceScore       Float?    // 0-100

  // Status
  status      String    @default("in_progress")  // "in_progress" | "completed" | "cancelled"
  duration    Int?      // Duration in seconds

  // Generated Report
  soapReport  SOAPReport?

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("clinical_session")
}
```

**Conversation Log Structure:**

```typescript
type ConversationLog = Array<{
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    isVoice?: boolean;
    language?: string;
    thinkingSteps?: ThinkingStep[];
  };
}>;
```

---

### SOAPReport

SOAP (Subjective, Objective, Assessment, Plan) reports generated from clinical interviews.

```prisma
model SOAPReport {
  id              String   @id @default(cuid())
  sessionId       String   @unique
  session         ClinicalSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  patientId       String
  patient         User     @relation(fields: [patientId], references: [id], onDelete: Cascade)

  // SOAP Format (all stored as JSON)
  subjective      Json     // Patient's complaints
  objective       Json     // Recorded symptoms
  assessment      Json     // AI diagnosis
  plan            Json     // Recommendations

  // Department & Priority
  department      String?  // "cardiology", "neurology", etc.
  priority        String   @default("normal")  // "urgent" | "high" | "normal" | "low"

  // Doctor Review
  assignedDoctorId String?
  reviewStatus    String   @default("pending")  // "pending" | "in_review" | "approved" | "rejected"
  doctorNotes     String?
  prescription    String?

  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  reviewedAt      DateTime?

  @@map("soap_report")
}
```

**SOAP JSON Structure:**

```typescript
// Subjective
{
  chiefComplaint: string;
  symptoms: string[];
  patientHistory: string;
  patientNarrative: string;
}

// Objective
{
  reportedSymptoms: string[];
  severity: "critical" | "high" | "moderate" | "initial" | "normal";
  confidenceLevel: number;
  vitalSigns?: Record<string, string>;
}

// Assessment
{
  primaryDiagnosis: string;
  differentialDiagnosis: string[];
  severity: "critical" | "high" | "moderate" | "initial" | "normal";
  confidence: number;
  aiAnalysis: string;
  redFlags: string[];
  medicalSources: string[];
}

// Plan
{
  recommendations: string[];
  testsNeeded: string[];
  specialistReferral?: string;
  followUpNeeded: boolean;
  urgency: "emergency" | "urgent" | "standard" | "routine";
}
```

---

### DoctorProfile

Professional information for doctor users.

```prisma
model DoctorProfile {
  id              String   @id @default(cuid())
  doctorId        String   @unique
  doctor          User     @relation(fields: [doctorId], references: [id], onDelete: Cascade)

  // Basic Info
  fullName        String?
  phone           String?
  address         String?
  dateOfBirth     String?
  profileImage    String?

  // Professional Info
  specialization  String?   // "Cardiologist", "Neurologist", etc.
  qualification   String?   // "MBBS, MD", "MBBS, FCPS"
  experience      Int?      // Years of experience
  licenseNumber   String?
  hospital        String?
  department      String?   // Matches SOAPReport.department
  bio             String?

  // Status
  isComplete      Boolean   @default(false)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@map("doctor_profile")
}
```

---

### Verification

Email verification tokens for Better Auth.

```prisma
model Verification {
  id         String    @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime  @default(now())
  updatedAt  DateTime? @updatedAt

  @@map("verification")
}
```

---

## Queries Examples

### Get Patient with Full History

```typescript
const patientData = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    medicalHistory: true,
    clinicalSessions: {
      include: { soapReport: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    },
  },
});
```

### Get Pending Reports for Doctor

```typescript
const reports = await prisma.sOAPReport.findMany({
  where: {
    department: doctorProfile.department,
    reviewStatus: { in: ['pending', 'in_review'] },
  },
  include: {
    patient: { select: { name: true, email: true } },
    session: { select: { chiefComplaint: true } },
  },
  orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
});
```

### Create New Clinical Session

```typescript
const session = await prisma.clinicalSession.create({
  data: {
    patientId: userId,
    chiefComplaint: complaint,
    conversationLog: [],
    status: 'in_progress',
  },
});
```

### Update Report with Doctor Review

```typescript
await prisma.sOAPReport.update({
  where: { id: reportId },
  data: {
    reviewStatus: 'approved',
    prescription: prescriptionText,
    doctorNotes: notes,
    assignedDoctorId: doctorId,
    reviewedAt: new Date(),
  },
});
```

---

## Indexes & Constraints

| Table            | Index      | Type   |
| ---------------- | ---------- | ------ |
| user             | email      | Unique |
| session          | token      | Unique |
| medical_history  | patientId  | Unique |
| clinical_session | patientId  | Index  |
| soap_report      | sessionId  | Unique |
| soap_report      | patientId  | Index  |
| soap_report      | department | Index  |
| doctor_profile   | doctorId   | Unique |

---

## Migration Commands

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (dev)
npx prisma db push

# Create migration (production)
npx prisma migrate dev --name <migration_name>

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```
