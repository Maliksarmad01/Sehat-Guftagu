# Sehat Guftagu - Technical Documentation

> **Version:** 2.0  
> **AI Model:** Groq LLaMA 3.3 70B  
> **Framework:** Next.js 16 + LangGraph

## Overview

Sehat Guftagu (صحت گفتگو) is an AI-powered clinical interview system designed for Pakistan's healthcare landscape. It conducts medical interviews in Urdu/English, generates SOAP reports, and connects patients with doctors through an intelligent triage system.

## Documentation Index

| Document                                | Description                                                     |
| --------------------------------------- | --------------------------------------------------------------- |
| [Architecture](./architecture.md)       | System architecture, multi-agent workflow, and technology stack |
| [Agents](./agents.md)                   | Detailed documentation of all 5 AI agents                       |
| [API Reference](./api-reference.md)     | Complete API endpoints documentation                            |
| [Database Schema](./database-schema.md) | Prisma schema and data models                                   |
| [Environment Setup](./environment.md)   | Environment variables and configuration                         |
| [Components](./components.md)           | Frontend components documentation                               |

## Quick Links

- **User Documentation:** [localhost:3000/docs](http://localhost:3000/docs)
- **Patient Portal:** [localhost:3000/patient/dashboard](http://localhost:3000/patient/dashboard)
- **Doctor Portal:** [localhost:3000/doctor/dashboard](http://localhost:3000/doctor/dashboard)

## System Architecture (High-Level)

![System Architecture](./images/Sytem%20Architecture%20Design.jpg)
_Complete System Architecture_

```
┌─────────────────────────────────────────────────────────────────┐
│                         Patient Portal                           │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────────────┐ │
│  │  Login   │→ │  Onboarding  │→ │  Clinical Interview        │ │
│  │          │  │  (History)   │  │  (Voice/Text + AI Agents)  │ │
│  └──────────┘  └──────────────┘  └────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                      AI Agent Pipeline                            │
│  ┌────────────┐  ┌─────────────┐  ┌───────────┐  ┌────────────┐ │
│  │ History    │→ │ Interview   │→ │ Document  │→ │ Safety     │ │
│  │ Collector  │  │ & Reasoning │  │ Generator │  │ Check      │ │
│  └────────────┘  └─────────────┘  └───────────┘  └────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                         Doctor Portal                             │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────────────┐   │
│  │ Dashboard  │→ │ Review SOAP  │→ │ Write Prescription     │   │
│  │            │  │ Reports      │  │ Approve/Reject         │   │
│  └────────────┘  └──────────────┘  └────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

## Key Features

- **Bilingual Support:** Urdu/English with automatic translation
- **Voice & Text Modes:** Supports both voice and text-based interviews
- **Multi-Agent System:** 5 specialized AI agents using LangGraph
- **SOAP Reports:** Automated medical report generation
- **Doctor Review:** Human-in-the-loop approval workflow
- **Emergency Triage:** Automatic red flag detection and prioritization
- **RAG Integration:** Medical knowledge retrieval from Pinecone

## Tech Stack

| Category  | Technology                          |
| --------- | ----------------------------------- |
| Frontend  | Next.js 16, React 19, TailwindCSS 4 |
| Backend   | Next.js API Routes                  |
| Database  | PostgreSQL + Prisma ORM             |
| AI/LLM    | Groq (LLaMA 3.3 70B), LangGraph     |
| Vector DB | Pinecone                            |
| Auth      | Better Auth                         |
| TTS       | ElevenLabs, Uplift AI, Groq Orpheus |
| STT       | Groq Whisper                        |

## Getting Started

```bash
# Clone repository
git clone <repo-url>

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Run development server
npm run dev
```

Visit [localhost:3000](http://localhost:3000) to access the application.
