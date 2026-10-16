# Local AI Engine

## Scope

The groundwater assistant uses server-validated structured intents and a
server-only provider interface. Local development defaults to Ollama;
production defaults to hosted OpenAI HTTPS, with OpenRouter available as an
explicit third server-only option, never laptop localhost. See
[Production AI provider](production-ai-provider.md) for deployment configuration.
Ticket 26 adds bounded conversational hints and a conservative fast path for
clear place questions. Conversation text stays in browser memory; there is
no persisted conversation store or unrestricted model memory.

The browser calls `POST /api/chat`. The API verifies the Supabase user and
accepts a message plus at most four recent user questions (each at most
2,000 characters). Exact current place names can produce a validated intent
directly; other phrasing uses Gemma's structured intent step. One approved
action fetches current facts. Focused classification/extraction/recharge
answers use deterministic formatting; general answers use Gemma with a
deterministic fallback. Supabase remains the source of truth.

```text
authenticated browser
        |
        v
POST /api/chat
        |
        v
verified simple intent OR Gemma 3 4B intent JSON
        |
        v
validated allowlisted action
        |
        v
existing server-side query layer -> Supabase
        |
        v
deterministic focused answer OR Gemma answer with grounded fallback
```

## Ollama configuration

Install and start Ollama locally, then pull Gemma 3 4B:

```text
ollama serve
ollama pull gemma3:4b
```

Configure `.env.local` without exposing these variables as `NEXT_PUBLIC_*`:

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma3:4b
OLLAMA_KEEP_ALIVE=10m
AI_INTENT_TIMEOUT_MS=30000
AI_ANSWER_TIMEOUT_MS=30000
AI_INTENT_MAX_TOKENS=256
AI_ANSWER_MAX_TOKENS=512
```

`OLLAMA_BASE_URL` defaults to `http://localhost:11434`, `OLLAMA_MODEL` defaults
to `gemma3:4b`. Each local stage defaults to 30 seconds. Existing
`OLLAMA_TIMEOUT_MS` remains a shared fallback when the corresponding
`AI_*_TIMEOUT_MS` is unset or blank. `AI_INTENT_MODEL` can override the local
intent model; `AI_ANSWER_MODEL` defaults to that model. The integration uses
Ollama's ordinary HTTP `POST /api/chat` text-generation endpoint up to twice: first
with an explicit JSON schema for intent output, then with the validated
database result for answer generation. No native Ollama tool-calling capability
or `tools` definitions are required, and no Ollama request is made by browser
code. Both requests send `keep_alive: "10m"` (configurable `1m`–`60m`), keeping
the model resident between interactions without a Next.js background process.
The intent request uses temperature 0 and 256 output tokens; answers use
temperature 0.2 and 512 tokens. Token limits are configurable and bounded.
Ollama gets no HTTP retries. A cold load still counts against the stage deadline;
increase the local budget on slower hardware. Separate models may increase
memory use or evict each other, so start with one model.

## Approved tools

The validated intent may select only these existing query-layer functions:

- `getDistricts`
- `getAssessmentUnits`
- `getAssessment`
- `getDistrictSummary`
- `getClassificationSummary`
- `getTopExtractionAreas`
- `getOverallSummary`
- `getDistrictComparison`

The intent schema uses an explicit action allowlist, strict top-level shape,
strict object-key checks, string checks, year bounds, and the existing
query-layer validation. Unknown actions, malformed JSON arguments, unsupported
properties, invalid years, and invalid limits are rejected. Model output is
never evaluated as JavaScript and is never treated as SQL. The application
executor performs at most one approved factual action per request; Gemma never
executes a tool directly. A separate, paginated 2024 place-name query resolves
districts and assessment units. It retrieves no measurements and does not
cache factual answers.

## Grounding contract

The engine returns:

```ts
{
  answer: string;
  grounded: boolean;
  source: string;
  year: number | null;
  toolsUsed: string[];
  metadata: {
    dataScope: "2024";
    engine: "ollama" | "hosted" | "openrouter" | "unconfigured";
    modelConfigured: boolean;
  };
}
```

`grounded` is true only after a validated approved action executes successfully,
returns a structured query result, and the answer is generated from that result
by the focused formatter, Gemma, or deterministic fallback. A question that cannot produce a successful database
result is rejected with a safe, non-numerical fallback. The system
prompt directs the model to use only the current structured 2024 dataset, to
describe missing values as unavailable, and to use `ha-m` for resource and
extraction fields. `1 ha-m = 10,000 m³ = 10 million litres`.

General requests can use two logical model stages: one intent call and one answer
call. Clear status and metric requests use no model calls. The engine has an explicit maximum of two
model stages and one factual action per request (hosted providers may retry each
stage once). Invalid intent, unsupported years and query failures stop safely.
Planner failure cannot guess an intent. After a successful query, failed,
empty or truncated answer generation uses deterministic grounded formatting.
An unavailable provider therefore does not prevent supported fast paths or
summaries with safely resolved intents from returning useful data.

The planner prompt removes repetitive instructions and is now 2,635 characters, retaining the
eight approved actions, argument mappings, 2024-only boundary, exact-name
rules and essential examples. It receives only the question plus verified
names/year/topic, not measurements or the raw history. Final formatting gets
only the selected query result and question; assessment IDs, source bookkeeping,
codes and timestamps are removed, not water metrics or nulls. Context above
16,000 characters uses complete deterministic formatting instead of truncation.

## Conversational classification and follow-ups (Ticket 26)

Status, category, classification, zone, safe/critical assertions and questions
such as “Which category does Mumbai fall under?” use the existing
`getDistrictSummary` or `getAssessment` action. These two actions now accept
optional `topic` (`summary`, `classification`, `extraction`, `recharge`) and,
only for classification, an allowlisted `proposedClassification`. No action
was added. Prompt examples cover informal assertions and follow-ups.

The server checks names against current 2024 database locations, with exact
case-insensitive matching and no fuzzy place-name correction. A short closed
vocabulary recognizes clear local questions before the general planner. Small
normalizations cover `critcal`, `over exploited` / `over-exploited` /
`overexploited`, `semi critical` / `semi-critical`, and `ground water`. More
complex language still goes to Gemma. Ambiguous unit names require a district
or an unambiguous recent district hint. District names take district scope
unless the question explicitly selects an assessment unit.

Classification counts come from the records read by `getDistrictSummary`.
If one category has records, the answer names that category; an assertion can
receive a direct yes/no grounded in that category. If several categories have
records, the answer always shows the actual count distribution and does not
give a district-wide yes/no. Counts have no ha-m suffix. Focused classification
answers are rendered deterministically even if Gemma selected the action,
preventing the formatter from collapsing mixed classifications.

The API accepts only `message` and an optional `history` array of at most four
recent user-question strings, bounded to 2,000 characters each. Assistant
prose and arbitrary fields are rejected. The server re-resolves these hints
against current names, retaining only district, unit, 2024 and topic. Raw
history is not supplied to Gemma. Every follow-up fetches current measurements
again; it never copies factual values from an earlier answer. A missing or
ambiguous antecedent receives a clarification. Clear chat removes browser
messages and therefore all follow-up hints. Unsupported years reset usable
history context rather than granting historical access.

`Is it safe or critical?`, `What is its extraction?`, `And recharge?` and
`What about Pune?` resolve through these bounded hints. The response explains
dataset classifications, not drinking-water suitability. Predictions, future
or historical years, live water-table readings and weather remain unsupported.

The UI renders an error/unsupported explanation once when `answer` duplicates
`error.message`. Normal grounded Markdown and source metadata are preserved.

## Timing

Response metadata includes `timings.intent_ms`, `db_ms`, `generation_ms`,
`total_ms`, `provider`, `fast_path_used`, `fallback_used` and resolution
(`fast`, `planner`, `rejected`). A focused deterministic answer is not a
failure fallback. `db_ms` includes
both the place-name lookup and factual query. Development-only server logs
contain these timing values without questions, history, answers or credentials.
Production logging is disabled. `/api/chat` also exposes numeric `Server-Timing`
durations; its total includes authentication and request handling. Direct
focused answers have zero model-generation time. Measurements are local
baselines, not latency guarantees.

Observed local samples on 2026-10-15, with the configured Gemma model and
current Supabase data (milliseconds):

| Request | Intent | Database | Generation | Total |
| --- | ---: | ---: | ---: | ---: |
| Mumbai typo/status fast path | 2.2 | 358.2 | 0 | 360.4 |
| Mumbai summary | 0.6 | 356.6 | 29009.0 | 29366.4 |
| “Is it safe or critical?” after Mumbai | 2.0 | 883.5 | 0 | 885.6 |
| Broader Mumbai category wording through Gemma | 19049.1 | 677.8 | 0 | 19727.4 |

## Security boundaries

- `/api/chat` requires an authenticated Supabase user.
- Ollama, OpenAI, OpenRouter and Supabase calls remain server-side.
- The Supabase service-role key is read only by the existing `.server.ts`
  query layer and is never passed to Ollama or the browser.
- Tool selection is an allowlist; there is no dynamic function lookup.
- Tool arguments are validated before any query is executed.
- Query failures, model failures, and configuration failures return safe user
  messages without stack traces, credentials, or raw database errors.
- No chat-history table or persistence is added.

## Validation

Run the static and optional live validation:

```text
node --experimental-strip-types --env-file=.env.local scripts/validate-ai-engine.mjs
node scripts/validate-ai-provider.mjs
node --env-file=.env.local scripts/validate-ai-conversation.mjs
node --env-file=.env.local scripts/validate-ai-conversation.mjs --live
```

The script checks the allowlist, strict rejection behavior, query-layer reuse,
round limit, no SQL/code-execution patterns, server-only boundaries, local
configuration, grounding metadata, 2024 scope, units, safe errors, and API
authentication. If Ollama is reachable, it runs six live smoke cases covering
classification distribution, Pune resources, Indapur, Pune highest extraction
units, unit-definition safety, and unsupported historical years; otherwise it
reports that the live smoke test was skipped and still passes static validation.

The conversation validator exercises twenty status variants against current
Supabase data, mixed Pune categories, assessment-unit assertions, real-data
follow-ups, ambiguity and invalid context. It deliberately fails model calls
to verify the deterministic answer/fallback path while keeping real database
queries. It also checks strict year/scope boundaries, and that follow-ups issue
new requests. The original engine validator runs live Gemma cases when the
configured model is reachable.
The optional `--live` conversation run additionally exercises a Mumbai summary,
its short follow-up, and less constrained status wording through the actual
Gemma planner, reporting timing metadata for each.

The provider validator needs neither Supabase configuration nor hosted credentials:
it injects fixture HTTP for all three adapters and for the real engine/query layer.
It covers selection, strict nullable-schema conversion, timeouts, retries,
offline/401/403/429/5xx, refusals, incomplete/malformed output, secret boundaries,
validation before factual queries, fresh follow-ups and deterministic fallback.
CLI validators use `ai-test-runtime.mjs` to resolve the `server-only` marker
outside Next; the production bundle retains the real server-only guard.

The local model is small and is not guaranteed to be accurate. A successful
grounding flag means that an approved NeerDrishti query result was supplied to
the model; it is not a guarantee that the model phrased the result perfectly.
Users should treat the underlying Explorer and Analytics views as the direct
structured-data surfaces.

## Chat UI integration

The protected `/app/chat` page provides the browser conversation interface for
`POST /api/chat`. It keeps messages only in client memory for the current page
session; refreshing the page clears them. The browser never calls Ollama,
OpenAI or OpenRouter directly.

Assistant messages render a small safe Markdown subset as React elements, not
arbitrary HTML. The grounded badge and source/context panel are rendered only
from the API response's `grounded`, `source`, `year`, and `toolsUsed` fields.
Loading, authentication, unavailable-service, malformed-response, and retry
states are handled in the UI. Resource and extraction values remain displayed
in `ha-m` without client-side conversion.
