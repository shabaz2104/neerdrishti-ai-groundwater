# NeerDrishti Project Baseline

This repository was empty before the initial project scaffolding and is now being initialized with the required Next.js foundation for the NeerDrishti application.

## Current project status

The project currently contains the initial application shell and supporting configuration for a lightweight Next.js foundation. It includes a minimal landing page, TypeScript setup, Tailwind styling, ESLint, and a Supabase client foundation. No groundwater functionality, authentication, data ingestion, AI integration, or RAG layer is implemented yet.

## Technology stack

- Next.js 16 — configured via the app scaffold and `package.json`
- React 19 — installed as the framework runtime
- TypeScript — configured in `tsconfig.json`
- Tailwind CSS — configured through the generated Next.js setup and `app/globals.css`
- ESLint — configured via `eslint.config.mjs`
- Supabase JavaScript client — used in `lib/supabase.ts`

## Repository structure

```text
neerdrishti-final/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   └── supabase.ts
├── docs/
│   └── project-baseline.md
├── .env.example
├── .gitignore
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── README.md
├── tsconfig.json
└── public/
```

## Existing functionality

### Working
- Minimal Next.js application shell loads successfully
- Landing page renders the NeerDrishti branding and description
- Tailwind CSS styling is active
- TypeScript is enabled with strict mode
- ESLint is configured
- Supabase client can be imported from `lib/supabase.ts`

### Partially implemented
- Supabase client foundation exists, but no database queries or auth logic are active yet

### Placeholder/stub
- The landing page is intentionally a minimal shell and does not yet include real product functionality

### Not implemented
- Authentication
- Data explorer
- Groundwater visualizations
- Admin dataset upload
- AI chatbot
- Gemini integration
- RAG/vector-search
- Database schema
- Data ingestion

## Database status

- Database exists: Not yet configured in the repository
- Database technology: Supabase has been prepared conceptually via the client library, but no schema or database is created
- Existing tables/schema: None
- Migrations: None
- Supabase configuration: Client config exists via environment variables and `lib/supabase.ts`
- Seed data: None
- Groundwater-related tables: None

## Authentication status

Authentication is not implemented in this ticket. No login or session flow exists yet.

## AI status

- Gemini or LLM integration: Not implemented
- Integration location: None
- Prompt handling: None
- Grounded responses: Not yet implemented

## RAG status

RAG is not currently implemented.

## Data status

No groundwater dataset files were added in this ticket. The application currently contains no datasets or data-ingestion code.

## Existing tests

No application tests were added in this ticket. The project is only scaffolded and the base shell is in place.

## Known gaps

- No groundwater explorer or dashboard
- No database schema or Supabase setup beyond a client foundation
- No authentication
- No AI integration or chatbot
- No RAG/vector-search layer
- No dataset upload or processing pipeline
- No actual groundwater data files

## Recommended implementation starting point

The next logical implementation area is to define the app configuration and data layer foundation in alignment with the SRS, particularly the Supabase project setup and environment configuration, before moving into UI and data features.
