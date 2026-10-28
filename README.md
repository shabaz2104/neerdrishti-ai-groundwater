# NeerDrishti

NeerDrishti is a grounded groundwater insight system for Maharashtra's verified
2024 assessment data. It combines a public data introduction, authenticated
dashboard, Explorer, analytics and district map, a grounded AI assistant, and a
role-protected administration workspace.

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

Local and deployment configuration uses these values. Keep the privileged
service-role value only in a secure local/deployment secret store; it is
deliberately omitted from `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
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
- `SUPABASE_SERVICE_ROLE_KEY` is server-only. Never prefix it with `NEXT_PUBLIC_`
  or expose it to browser code.
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

The feature-complete application includes:

- public landing and Supabase authentication flows
- authenticated dashboard, Explorer, analytics and Maharashtra district map
- grounded groundwater assistant with Ollama, OpenAI and OpenRouter transports
- secure administrator authorization, record correction and CSV import workflows
- persistent website-wide light/dark mode that follows the operating system until
  the user selects a preference
- normalized 2024 Maharashtra groundwater data and source documentation
- structural, regression, security and performance validators in `scripts/`

The verified baseline is 359 assessment records, 36 districts, 350 unique
assessment-unit names and assessment year 2024. Groundwater volumes are shown in
ha-m. See `docs/theme-system.md`, `docs/final-demo-readiness.md` and
`docs/final-presentation-qa.md` for
the latest presentation-readiness status and remaining external blockers.
