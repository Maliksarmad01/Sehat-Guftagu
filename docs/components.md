# Components Documentation

## Overview

This document describes the key frontend components in Sehat Guftagu.

## Directory Structure

```
components/
├── auth/           # Authentication components
├── landing/        # Landing page sections
├── layout/         # Layout components
├── ui/             # Reusable UI components
└── voice/          # Voice interaction components
```

---

## Auth Components

### AuthForm.tsx

Universal authentication form supporting login and signup modes.

**Props:**

```typescript
interface AuthFormProps {
  mode: 'login' | 'signup';
}
```

**Features:**

- Email/password authentication
- Google OAuth button
- Form validation
- Error handling
- Loading states

**Usage:**

```tsx
<AuthForm mode="login" />
<AuthForm mode="signup" />
```

---

## Landing Components

### Hero.tsx

Main hero section with animated text and CTA buttons.

### Features.tsx

Feature cards showcasing platform capabilities:

- Voice-based interviews
- AI-powered diagnosis
- Bilingual support
- Doctor connectivity

### HowItWorks.tsx

Step-by-step guide showing the patient journey.

### CTASection.tsx

Call-to-action section with signup prompts.

### Footer.tsx

Footer with links and credits.

---

## Layout Components

### Navbar.tsx

Global navigation bar with authentication-aware menu.

**Features:**

- Logo and brand
- Navigation links
- Login/Signup buttons (unauthenticated)
- User dropdown (authenticated)
- Role-based navigation (patient/doctor)

**Usage:**

```tsx
<Navbar />
```

---

## UI Components

### button.tsx

Customizable button component using CVA (Class Variance Authority).

**Variants:**

```typescript
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white hover:bg-primary/90',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
        outline: 'border border-input bg-transparent hover:bg-accent',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
  }
);
```

**Usage:**

```tsx
<Button variant="default" size="lg">Click Me</Button>
<Button variant="outline">Cancel</Button>
```

---

### ThinkingActivity.tsx

Displays AI agent thinking progress with dynamic messages.

**Props:**

```typescript
interface ThinkingActivityProps {
  isVisible: boolean;
  currentPhase?: string;
}
```

**Features:**

- Animated spinner
- Dynamic phase messages
- Elapsed time counter
- Thinking progress dots

**Message Pools:**

```typescript
const TRANSLATION_ACTIONS = [
  'Analyzing message language...',
  'Processing bilingual input...',
  // ...
];

const RAG_ACTIONS = [
  'Searching medical knowledge base...',
  'Retrieving relevant medical information...',
  // ...
];
```

**Usage:**

```tsx
<ThinkingActivity
  isVisible={isThinking}
  currentPhase="Processing your response..."
/>
```

---

### ReportCompleteDialog.tsx

Modal dialog shown when clinical interview is complete and report is generated.

**Props:**

```typescript
interface ReportCompleteDialogProps {
  open: boolean;
  onClose: () => void;
  reportId: string;
  department: string;
  triageLabel: string;
}
```

**Features:**

- Success animation
- Report summary
- Navigation to report
- Department and triage display

---

### VoiceOrbNew.tsx

Animated voice recording indicator with pulsing effect.

**Props:**

```typescript
interface VoiceOrbNewProps {
  isRecording: boolean;
  isPlaying: boolean;
  onClick: () => void;
  disabled?: boolean;
}
```

**States:**

- Idle (ready to record)
- Recording (pulsing animation)
- Playing (speaker animation)
- Disabled (greyed out)

---

## Voice Components

### MedicalHistoryOnboarding.tsx

Complete medical history onboarding flow component.

**Features:**

- 15-question structured interview
- Voice and text input support
- Progress tracking
- Bilingual prompts
- Auto-save to database

**State:**

```typescript
interface OnboardingState {
  currentQuestion: number;
  collectedData: Record<string, any>;
  conversationHistory: ChatMessage[];
  isComplete: boolean;
}
```

**Usage:**

```tsx
<MedicalHistoryOnboarding
  onComplete={() => router.push('/patient/dashboard')}
/>
```

---

### VoiceOrb.tsx

Legacy voice recording component (used in interview page).

**Props:**

```typescript
interface VoiceOrbProps {
  isRecording: boolean;
  isPlaying: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  disabled?: boolean;
}
```

---

## Custom Hooks

### useMedicalHistory.ts

Hook for managing medical history state and API calls.

```typescript
function useMedicalHistory() {
  const [history, setHistory] = useState<MedicalHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    /* ... */
  };
  const updateHistory = async (data: Partial<MedicalHistory>) => {
    /* ... */
  };
  const submitQuestion = async (response: string, question: number) => {
    /* ... */
  };

  return {
    history,
    loading,
    error,
    fetchHistory,
    updateHistory,
    submitQuestion,
  };
}
```

**Usage:**

```tsx
const { history, loading, submitQuestion } = useMedicalHistory();

const handleSubmit = async (response: string) => {
  await submitQuestion(response, currentQuestion);
};
```

---

## Page Components

### Patient Pages

#### patient/dashboard/page.tsx

- Session history list
- Prescription downloads
- Quick stats
- New interview button

#### patient/interview/page.tsx

- Main clinical interview interface
- Voice/text mode toggle
- ThinkingActivity display
- Report generation trigger

#### patient/profile/page.tsx

- Medical history view
- Edit profile form
- History completion status

---

### Doctor Pages

#### doctor/dashboard/page.tsx

- Pending reports queue
- Stats overview
- Quick actions

#### doctor/report/[id]/page.tsx

- Full SOAP report view
- Review actions (approve/reject)
- Prescription editor
- Star rating

#### doctor/profile/page.tsx

- Professional profile form
- Department selection
- License information

---

## Styling

All components use TailwindCSS 4 with custom design tokens:

```css
/* globals.css */
@theme {
  --color-primary: #10b981; /* Emerald */
  --color-secondary: #3b82f6; /* Blue */
  --color-accent: #8b5cf6; /* Purple */
  --color-background: #0f172a; /* Dark slate */
  --color-foreground: #f8fafc; /* Light */
}
```

---

## Animations

Using Framer Motion and GSAP for animations:

```tsx
// Framer Motion example
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
  {children}
</motion.div>;

// GSAP example
gsap.to(element, {
  scale: 1.1,
  duration: 0.5,
  ease: 'power2.out',
});
```
