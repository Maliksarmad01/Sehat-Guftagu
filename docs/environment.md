# Environment Configuration

## Overview

This document lists all environment variables required to run Sehat Guftagu.

## Environment File

Create a `.env` file in the project root with the following variables:

```env
# ============================================
# DATABASE
# ============================================
DATABASE_URL="postgresql://username:password@host:5432/database"

# ============================================
# AUTHENTICATION (Better Auth)
# ============================================
BETTER_AUTH_SECRET="your-secret-key-minimum-32-chars"
BETTER_AUTH_URL="http://localhost:3000"

# ============================================
# OAUTH - Google (Optional)
# ============================================
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# ============================================
# AI / LLM - Groq
# ============================================
GROQ_API_KEY="gsk_your_groq_api_key"

# ============================================
# VECTOR DATABASE - Pinecone
# ============================================
PINECONE_API_KEY="your-pinecone-api-key"
PINECONE_INDEX_NAME="medical-fast-search"
PINECONE_ENVIRONMENT="us-east-1"

# ============================================
# TEXT-TO-SPEECH
# ============================================
# ElevenLabs (Primary)
ELEVENLABS_API_KEY="your-elevenlabs-api-key"

# Uplift AI (Secondary - Urdu specialized)
UPLIFT_API_KEY="your-uplift-api-key"

# ============================================
# OPTIONAL
# ============================================
# Google AI (if using Gemini)
GOOGLE_API_KEY="your-google-ai-api-key"

# Supabase (if using direct connection)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

---

## Variable Details

### Database

| Variable       | Description                  | Required |
| -------------- | ---------------------------- | -------- |
| `DATABASE_URL` | PostgreSQL connection string | Yes      |

**Format:**

```
postgresql://[user]:[password]@[host]:[port]/[database]
```

**Examples:**

```env
# Local development
DATABASE_URL="postgresql://postgres:password@localhost:5432/sehat_guftagu"

# Supabase
DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"

# Neon
DATABASE_URL="postgresql://[user]:[password]@[endpoint].neon.tech/neondb"
```

---

### Authentication

| Variable               | Description                       | Required |
| ---------------------- | --------------------------------- | -------- |
| `BETTER_AUTH_SECRET`   | JWT signing secret (min 32 chars) | Yes      |
| `BETTER_AUTH_URL`      | Application base URL              | Yes      |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID            | No       |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret        | No       |

**Generating a Secret:**

```bash
openssl rand -base64 32
```

---

### AI / LLM

| Variable       | Description                   | Required |
| -------------- | ----------------------------- | -------- |
| `GROQ_API_KEY` | Groq API key for LLaMA models | Yes      |

**Getting Groq API Key:**

1. Go to [console.groq.com](https://console.groq.com)
2. Create an account
3. Generate an API key

**Models Used:**

- `llama-3.3-70b-versatile` - Main reasoning model
- `llama-3.1-8b-instant` - Fast translation model

---

### Vector Database (Pinecone)

| Variable               | Description                                 | Required |
| ---------------------- | ------------------------------------------- | -------- |
| `PINECONE_API_KEY`     | Pinecone API key                            | Yes      |
| `PINECONE_INDEX_NAME`  | Index name (default: `medical-fast-search`) | Yes      |
| `PINECONE_ENVIRONMENT` | Pinecone environment                        | No       |

**Setting Up Pinecone:**

1. Create account at [pinecone.io](https://www.pinecone.io)
2. Create an index with:
   - Dimensions: 384 (for Xenova embeddings)
   - Metric: Cosine
3. Copy API key and index name

---

### Text-to-Speech

| Variable             | Description                      | Required |
| -------------------- | -------------------------------- | -------- |
| `ELEVENLABS_API_KEY` | ElevenLabs API key (primary TTS) | No\*     |
| `UPLIFT_API_KEY`     | Uplift AI API key (Urdu TTS)     | No\*     |

\*At least one TTS provider is recommended for voice mode.

**TTS Fallback Chain:**

1. ElevenLabs (best quality, multilingual)
2. Uplift AI (best for Urdu)
3. Groq Orpheus (fallback)
4. Browser TTS (client-side final fallback)

**ElevenLabs Setup:**

1. Create account at [elevenlabs.io](https://elevenlabs.io)
2. Get API key from Profile Settings
3. Default voice: `TX3LPaxmHKxFdv7VOQHJ` (Liam - multilingual)

**Uplift AI Setup:**

1. Create account at [upliftai.org](https://upliftai.org)
2. Get API key from dashboard
3. Default voice: `v_meklc281` (Urdu Info V2)

---

## Development vs Production

### Development

```env
BETTER_AUTH_URL="http://localhost:3000"
DATABASE_URL="postgresql://postgres:password@localhost:5432/sehat_dev"
```

### Production

```env
BETTER_AUTH_URL="https://your-domain.com"
DATABASE_URL="postgresql://user:pass@production-host:5432/sehat_prod"
```

---

## Security Best Practices

1. **Never commit `.env` to version control**

   ```gitignore
   # .gitignore
   .env
   .env.local
   .env.production
   ```

2. **Use different keys for development and production**

3. **Rotate secrets regularly**

4. **Use environment-specific configs**

   ```
   .env.development
   .env.production
   .env.local (overrides)
   ```

5. **Validate required variables at startup**
   ```typescript
   if (!process.env.GROQ_API_KEY) {
     throw new Error('GROQ_API_KEY is required');
   }
   ```

---

## Vercel Deployment

When deploying to Vercel, add all environment variables in:

- Project Settings → Environment Variables

Important variables to set:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL` (your Vercel URL)
- `GROQ_API_KEY`
- `PINECONE_API_KEY`
- `PINECONE_INDEX_NAME`

---

## Example `.env.example`

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/sehat_guftagu"

# Authentication
BETTER_AUTH_SECRET="change-this-to-a-secure-32-char-secret"
BETTER_AUTH_URL="http://localhost:3000"

# OAuth (Optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# AI/LLM
GROQ_API_KEY=""

# Vector Database
PINECONE_API_KEY=""
PINECONE_INDEX_NAME="medical-fast-search"

# TTS (Optional)
ELEVENLABS_API_KEY=""
UPLIFT_API_KEY=""
```
