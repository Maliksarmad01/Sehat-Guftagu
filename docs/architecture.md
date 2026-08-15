# System Architecture

## Overview

Sehat Guftagu uses a multi-agent architecture powered by LangGraph for orchestrating clinical interviews. The system is built as a Next.js application with a PostgreSQL database and integrates multiple AI services.

![System Architecture Design](./images/Sytem%20Architecture%20Design.jpg)
_System Architecture Overview_

## Technology Stack

### Frontend

- **Next.js 16.1.1** - React framework with App Router
- **React 19** - UI library
- **TailwindCSS 4** - Styling
- **Framer Motion** - Animations
- **GSAP** - Advanced animations

### Backend

- **Next.js API Routes** - Server endpoints
- **Prisma ORM** - Database access
- **Better Auth** - Authentication

### AI & LLM

- **Groq LLaMA 3.3 70B Versatile** - Main reasoning model
- **Groq LLaMA 3.1 8B Instant** - Fast translation model
- **LangGraph** - Agent orchestration framework
- **Pinecone** - Vector database for RAG

### Voice Services

- **ElevenLabs** - Primary TTS (Multilingual V2)
- **Uplift AI** - Secondary TTS (Urdu specialized)
- **Groq Orpheus** - Fallback TTS
- **Groq Whisper** - Speech-to-text

## Directory Structure

```
sehat-guftagu/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── api/               # API endpoints
│   │   ├── auth/          # Better Auth routes
│   │   ├── clinical-chat/ # Main interview API
│   │   ├── doctors/       # Doctor management
│   │   ├── medical-history/
│   │   ├── patient/
│   │   ├── reports/       # SOAP report endpoints
│   │   ├── user/          # User role management
│   │   └── voice/         # STT/TTS endpoints
│   ├── doctor/            # Doctor portal pages
│   │   ├── dashboard/
│   │   ├── onboarding/
│   │   ├── profile/
│   │   └── report/[id]/
│   ├── patient/           # Patient portal pages
│   │   ├── dashboard/
│   │   ├── interview/
│   │   ├── medical_session/
│   │   └── profile/
│   └── docs/              # User documentation
├── components/
│   ├── auth/              # Authentication components
│   ├── landing/           # Landing page sections
│   ├── layout/            # Layout components
│   ├── ui/                # Reusable UI components
│   └── voice/             # Voice interaction components
├── hooks/                 # Custom React hooks
├── lib/
│   ├── agents/            # AI agent implementations
│   │   ├── types.ts       # Type definitions
│   │   ├── index.ts       # Main orchestrator
│   │   ├── interview-agent.ts
│   │   ├── history-collector.ts
│   │   ├── documentation-agent.ts
│   │   ├── safety-agent.ts
│   │   ├── feedback-agent.ts
│   │   ├── llm-utils.ts   # LLM helper functions
│   │   └── guardrails.ts  # Input validation
│   ├── constants/         # Application constants
│   ├── auth.ts            # Better Auth config
│   ├── auth-client.ts     # Client-side auth
│   ├── pinecone.ts        # Pinecone client
│   ├── prisma.ts          # Prisma client
│   └── utils.ts           # Utility functions
├── prisma/
│   └── schema.prisma      # Database schema
└── public/                # Static assets
```

## Agent Pipeline Architecture

![Orchestration Flow](./images/orchestration%20flow.jpeg)
_Multi-Agent Orchestration Flow_

```
                          ┌─────────────────────────────────────────┐
                          │           Patient Starts Session         │
                          └───────────────────┬─────────────────────┘
                                              │
                    ┌─────────────────────────▼─────────────────────────┐
                    │           1. HISTORY COLLECTOR AGENT              │
                    │   ─────────────────────────────────────────────   │
                    │   • Asks 15 structured medical history questions  │
                    │   • Collects: age, gender, conditions, allergies  │
                    │   • Bilingual prompts (English + Urdu)            │
                    │   • Saves to MedicalHistory table                 │
                    └───────────────────┬───────────────────────────────┘
                                        │
                    ┌───────────────────▼───────────────────────────────┐
                    │       2. INTERVIEW & REASONING AGENT              │
                    │   ─────────────────────────────────────────────   │
                    │   Sequential Sub-Agent Flow:                      │
                    │                                                   │
                    │   ┌─────────────────────────────────────────────┐ │
                    │   │  2.1 Translation Agent                      │ │
                    │   │      • Translates Urdu → English            │ │
                    │   │      • Uses fast 8B model                   │ │
                    │   │      • Skips if primarily English           │ │
                    │   └───────────────────┬─────────────────────────┘ │
                    │                       ▼                           │
                    │   ┌─────────────────────────────────────────────┐ │
                    │   │  2.2 RAG Retrieval Agent                    │ │
                    │   │      • Generates embeddings                 │ │
                    │   │      • Queries Pinecone (topK=5)            │ │
                    │   │      • Retrieves medical knowledge          │ │
                    │   └───────────────────┬─────────────────────────┘ │
                    │                       ▼                           │
                    │   ┌─────────────────────────────────────────────┐ │
                    │   │  2.3 History Fetch Agent                    │ │
                    │   │      • Retrieves patient history            │ │
                    │   │      • Formats for context                  │ │
                    │   └───────────────────┬─────────────────────────┘ │
                    │                       ▼                           │
                    │   ┌─────────────────────────────────────────────┐ │
                    │   │  2.4 Disease Identification Agent           │ │
                    │   │      • Starts with ~50 diseases             │ │
                    │   │      • Narrows based on symptoms            │ │
                    │   │      • Updates probabilities                │ │
                    │   └───────────────────┬─────────────────────────┘ │
                    │                       ▼                           │
                    │   ┌─────────────────────────────────────────────┐ │
                    │   │  2.5 Reasoning Agent                        │ │
                    │   │      • Generates clinical response          │ │
                    │   │      • Asks follow-up questions             │ │
                    │   │      • Updates confidence score             │ │
                    │   └─────────────────────────────────────────────┘ │
                    │                                                   │
                    │   Completion: 90%+ confidence OR <5 diseases      │
                    │   Turns: Min 10, Max 25                           │
                    └───────────────────┬───────────────────────────────┘
                                        │
                    ┌───────────────────▼───────────────────────────────┐
                    │          3. DOCUMENTATION AGENT                   │
                    │   ─────────────────────────────────────────────   │
                    │   • Compiles conversation into SOAP report        │
                    │   • Assigns department based on diagnosis         │
                    │   • Calculates triage label                       │
                    │   • Saves to SOAPReport table                     │
                    └───────────────────┬───────────────────────────────┘
                                        │
                    ┌───────────────────▼───────────────────────────────┐
                    │           4. SAFETY AGENT                         │
                    │   ─────────────────────────────────────────────   │
                    │   • Detects red flags and emergencies             │
                    │   • Calculates urgency score                      │
                    │   • Updates triage: emergency/urgent/standard     │
                    │   • Flags for immediate attention if needed       │
                    └───────────────────┬───────────────────────────────┘
                                        │
                                        ▼
                    ┌───────────────────────────────────────────────────┐
                    │              DOCTOR PORTAL                        │
                    │   Reports appear in doctor's dashboard            │
                    │   Filtered by department assignment               │
                    └───────────────────┬───────────────────────────────┘
                                        │
                    ┌───────────────────▼───────────────────────────────┐
                    │          5. FEEDBACK AGENT                        │
                    │   ─────────────────────────────────────────────   │
                    │   • Doctor reviews SOAP report                    │
                    │   • Actions: Approve / Reject / Request Changes   │
                    │   • If rejected: Regenerates report with feedback │
                    │   • Records prescription and notes                │
                    │   • Tracks star ratings for AI improvement        │
                    └───────────────────────────────────────────────────┘
```

## Request Flow

### Clinical Interview Request

```
┌──────────┐    ┌────────────────┐    ┌─────────────────┐
│  Client  │───►│  /api/clinical │───►│  Interview      │
│          │    │  -chat         │    │  Agent          │
└──────────┘    └────────────────┘    └─────────────────┘
                        │                     │
                        │              ┌──────▼──────┐
                        │              │  Groq LLM   │
                        │              └─────────────┘
                        │                     │
                        │              ┌──────▼──────┐
                        │              │  Pinecone   │
                        │              │  RAG Query  │
                        │              └─────────────┘
                        │                     │
                ┌───────▼───────┐      ┌──────▼──────┐
                │  PostgreSQL   │◄─────│  Response   │
                │  (Prisma)     │      │  Generated  │
                └───────────────┘      └─────────────┘
```

### Voice Processing

```
┌────────────────────────────────────────────────────────┐
│                    Voice Mode Flow                      │
└────────────────────────────────────────────────────────┘

User Speaks
     │
     ▼
┌─────────────────────┐
│  /api/voice/stt     │  Speech-to-Text (Groq Whisper)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  /api/clinical-chat │  Process through AI agents
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  /api/voice/tts     │  Text-to-Speech (Fallback Chain)
└──────────┬──────────┘
           │
           ▼
     ┌─────────────────────────────────────────┐
     │  TTS Fallback: ElevenLabs → Uplift →    │
     │                Groq Orpheus → Browser   │
     └─────────────────────────────────────────┘
           │
           ▼
   Audio Response
```

## Performance Optimizations

1. **Fast Translation Model:** Uses LLaMA 3.1 8B for translations (~3x faster)
2. **English Detection:** Skips translation for primarily English text
3. **Sequential Execution:** Prevents LangGraph concurrent update errors
4. **Dynamic Thinking UI:** Shows agent progress without blocking
5. **Streaming Responses:** Real-time UI updates during processing

## Security Considerations

- **Authentication:** Better Auth with session cookies
- **Input Validation:** Guardrails on all user inputs
- **Rate Limiting:** API route protection
- **Role-Based Access:** Patient/Doctor portals separated
- **SQL Injection:** Prisma ORM parameterized queries
