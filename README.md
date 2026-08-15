<div align="center">

<img src="public/logo/sehat-guftagu-logo.svg" alt="Sehat Guftagu Logo" width="200"/>

# Sehat Guftagu (صحت گفتگو)

### AI-Powered Clinical Interview System

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![LangChain](https://img.shields.io/badge/LangGraph-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)](https://langchain.com/)

[![Groq](https://img.shields.io/badge/Groq_LLaMA-FF6B35?style=for-the-badge&logo=meta&logoColor=white)](https://groq.com/)
[![Pinecone](https://img.shields.io/badge/Pinecone-000000?style=for-the-badge&logo=pinecone&logoColor=white)](https://www.pinecone.io/)
[![ElevenLabs](https://img.shields.io/badge/ElevenLabs-000000?style=for-the-badge&logo=elevenlabs&logoColor=white)](https://elevenlabs.io/)

</div>

---

## 🌟 Overview

**Sehat Guftagu** is an AI-powered clinical interview platform designed for healthcare landscape. It conducts medical interviews in **Urdu/English**, generates **SOAP reports**, and connects patients with doctors through an intelligent **triage system**.

<div align="center">

|         Feature         | Description                            |
| :---------------------: | :------------------------------------- |
|    🗣️ **Bilingual**     | Full Urdu/English conversation support |
|   🎙️ **Voice & Text**   | Choose your preferred interview mode   |
|  🤖 **Multi-Agent AI**  | 5 specialized LangGraph agents         |
|   📋 **SOAP Reports**   | Automated medical documentation        |
|  👨‍⚕️ **Doctor Portal**   | Review, approve, and prescribe         |
| 🚨 **Emergency Triage** | Automatic red flag detection           |
| 📚 **RAG Integration**  | Medical knowledge retrieval            |

</div>

---

## 🏗️ System Architecture

<div align="center">

<img src="docs/images/Sytem Architecture Design.jpg" alt="System Architecture" width="100%"/>

_Complete System Architecture Design_

</div>

---

## 🔄 Multi-Agent Orchestration

<div align="center">

<img src="docs/images/orchestration flow.jpeg" alt="Orchestration Flow" width="100%"/>

_AI Agent Pipeline - From Patient Interview to Doctor Review_

</div>

---

## 🔍 RAG Workflow

<div align="center">

<img src="docs/images/medical rag workflow.jpeg" alt="Medical RAG Workflow" width="100%"/>

_Medical Knowledge Retrieval System_

</div>

---

## 🛠️ Tech Stack

<div align="center">

### Frontend

|                                                       Technology                                                       | Purpose                          |
| :--------------------------------------------------------------------------------------------------------------------: | :------------------------------- |
|         <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg" width="40"/>          | **Next.js 16** - React Framework |
|          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="40"/>           | **React 19** - UI Library        |
|     <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="40"/>      | **TypeScript 5** - Type Safety   |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg" width="40"/> | **TailwindCSS 4** - Styling      |

### Backend & Database

|                                                  Technology                                                   | Purpose                          |
| :-----------------------------------------------------------------------------------------------------------: | :------------------------------- |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" width="40"/> | **PostgreSQL** - Database        |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/prisma/prisma-original.svg" width="40"/>  | **Prisma** - ORM                 |
|    <img src="https://github.com/user-attachments/assets/7dadde8f-b773-4006-8cc9-9f089bc7bf31" width="40"/>    | **Better Auth** - Authentication |

### AI & Services

|                                               Technology                                                | Purpose                             |
| :-----------------------------------------------------------------------------------------------------: | :---------------------------------- |
| <img src="https://github.com/user-attachments/assets/37a17015-e535-4fad-9d82-8643b65b40e7" width="40"/> | **Groq** - LLaMA 3.3 70B LLM        |
| <img src="https://github.com/user-attachments/assets/3a86b856-70ac-4e92-b106-6648ba371f9e" width="40"/> | **Pinecone** - Vector Database      |
| <img src="https://github.com/user-attachments/assets/158b63e5-7563-4301-881c-788554b1fbcc" width="40"/> | **LangGraph** - Agent Orchestration |
|                        <img src="https://elevenlabs.io/favicon.ico" width="40"/>                        | **ElevenLabs** - Text-to-Speech     |

</div>

---

## 🚀 Quick Start

### Prerequisites

<div align="center">

|                                             Requirement                                              | Version  |
| :--------------------------------------------------------------------------------------------------: | :------: |
|        ![Node](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)         |   18+    |
| ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-4169E1?logo=postgresql&logoColor=white) |  Latest  |
|                      ![Groq](https://img.shields.io/badge/Groq_API-Key-FF6B35)                       | Required |
|                  ![Pinecone](https://img.shields.io/badge/Pinecone-Account-000000)                   | Required |

</div>

### Installation

```bash
# Clone repository
git clone https://github.com/Inter-AI-Club-Umt/ai-hackathon-techverse2-team-muhammad-muzzammil.git
cd ai-hackathon-techverse2-team-muhammad-muzzammil

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Run development server
npm run dev
```

<div align="center">

🌐 Open [http://localhost:3000](http://localhost:3000) to view the application

</div>

---

## 📚 Documentation

<div align="center">

### 📖 User Guide

[![User Docs](https://img.shields.io/badge/User_Documentation-localhost:3000/docs-10B981?style=for-the-badge)](http://localhost:3000/docs)

### 🔧 Developer Documentation

|                 Document                  | Description                |
| :---------------------------------------: | :------------------------- |
|         📋 [Index](docs/index.md)         | Documentation overview     |
|  🏗️ [Architecture](docs/architecture.md)  | System design & tech stack |
|        🤖 [Agents](docs/agents.md)        | AI agents documentation    |
| 🔌 [API Reference](docs/api-reference.md) | Complete API docs          |
|  🗄️ [Database](docs/database-schema.md)   | Schema & models            |
|   ⚙️ [Environment](docs/environment.md)   | Setup guide                |
|    🎨 [Components](docs/components.md)    | UI components              |

</div>

---

## 🔌 API Endpoints

<div align="center">

| Endpoint               | Method | Description               |
| :--------------------- | :----: | :------------------------ |
| `/api/clinical-chat`   | `POST` | Process interview message |
| `/api/medical-history` | `POST` | Submit medical history    |
| `/api/reports`         | `GET`  | Get user's reports        |
| `/api/reports/[id]`    | `PUT`  | Doctor review action      |
| `/api/voice/stt`       | `POST` | Speech-to-text            |
| `/api/voice/tts`       | `POST` | Text-to-speech            |

</div>

---

## 🔄 Workflow

<div align="center">

### Patient Journey

```mermaid
graph LR
    A[🔐 Signup] --> B[📝 Onboarding]
    B --> C[🎙️ Interview]
    C --> D[📋 Report]
    D --> E[💊 Prescription]
```

### Doctor Journey

```mermaid
graph LR
    A[🔐 Signup] --> B[👨‍⚕️ Profile]
    B --> C[📊 Dashboard]
    C --> D[✅ Review]
    D --> E[📝 Prescribe]
```

</div>

---

## 📁 Project Structure

```
sehat-guftagu/
├── 📂 app/                    # Next.js App Router
│   ├── 📂 (auth)/            # Auth pages
│   ├── 📂 api/               # API endpoints
│   ├── 📂 docs/              # User documentation
│   ├── 📂 doctor/            # Doctor portal
│   └── 📂 patient/           # Patient portal
├── 📂 components/            # React components
├── 📂 docs/                  # Developer documentation
├── 📂 lib/
│   └── 📂 agents/           # AI agent implementations
├── 📂 prisma/               # Database schema
└── 📂 public/               # Static assets
```

---

## ⚙️ Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Authentication
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"

# AI Services
GROQ_API_KEY="gsk_..."
PINECONE_API_KEY="..."
PINECONE_INDEX_NAME="medical-fast-search"

# Voice Services
ELEVENLABS_API_KEY="..."
UPLIFT_API_KEY="..."
```

> 📖 See [docs/environment.md](docs/environment.md) for complete setup guide

---

## 🧪 Development

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run linter
npx prisma studio  # Open database UI
```
