# NeerDrishti

NeerDrishti is the initial foundation for an AI-powered groundwater insight system focused on Maharashtra groundwater data. This repository currently contains the core project scaffold and a minimal landing page only; it does not yet include groundwater features, authentication, AI workflows, dashboard logic, or data ingestion.

## Technology stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- ESLint
- Supabase JavaScript client

## Local development prerequisites

- Node.js 20 or later
- npm

## Installation

```bash
npm install
```

## Environment variable setup

Copy the example file and fill in the required values:

```bash
cp .env.example .env.local
```

The repository includes the following placeholders:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
AI_PROVIDER=
OPENROUTER_API_KEY=
OPENROUTER_INTENT_MODEL=
OPENROUTER_ANSWER_MODEL=
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma3:4b
OLLAMA_TIMEOUT_MS=30000
```

Notes:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are public client values and are safe to expose to the browser.
- Ollama runs locally and is called only by the authenticated server-side chat
  route. `OLLAMA_MODEL` is configurable because installed Ollama tags may vary.
- `AI_PROVIDER=openrouter` uses the server-only OpenRouter adapter. Configure
  `openrouter/free` or an explicit model ID without exposing the API key to the browser.

## Development command

```bash
npm run dev
```

## Build command

```bash
npm run build
```

## Current project status

The application is currently only the initial project foundation. It includes:
- a minimal Next.js app shell
- TypeScript configuration
- Tailwind CSS setup
- ESLint configuration
- a basic NeerDrishti landing page
- a Supabase client utility foundation

It does not yet implement the groundwater dashboard, data ingestion, authentication, AI chatbot, or RAG-related functionality.
