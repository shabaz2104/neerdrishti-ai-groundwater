# Production AI provider (Ticket 27)

## Architecture and boundaries

The authenticated browser still calls only `POST /api/chat` (Node.js runtime).
The engine first tries Ticket 26's conservative deterministic resolver, then
uses `AiProvider.generateIntent` only when necessary. Both paths pass the same
strict intent parser, exact current-place validation and eight-action executor.
The executor alone reads Supabase. Focused status/extraction/recharge answers
are deterministic; broader answers use `generateAnswer` with a deterministic
grounded fallback. No SQL execution, arbitrary tools, schema changes, writes,
new history storage or browser-side provider connections were introduced.

`lib/ai/ai-provider.server.ts` is guarded by `server-only`. It contains
`OllamaProvider`, `OpenAiProvider` and `OpenRouterProvider`, not database access. Provider HTTP is
isolated from the engine and injectable for tests. Hosted output never gets
to bypass `parseGroundwaterIntent`, `validateIntentEntities` or the fixed executor.
The catalog read supplies place names only. Recent user questions are reduced
to verified names/year/topic; every factual follow-up re-queries Supabase.

## Hosted APIs and models

The existing OpenAI implementation uses the Responses API at the fixed endpoint
`https://api.openai.com/v1/responses`. It sends `store: false`, never follows
redirects and never sends database credentials. Intent requests use
`text.format` with strict JSON schema, no native tool execution. OpenAI requires
all properties in a strict object to be required: the adapter makes known
optional arguments nullable, then removes only those known nulls before the
existing validator. Unknown fields/actions and invalid action-specific arguments
are still rejected. Refusals, incomplete output and tool calls are not intents.

Configure a Responses-compatible model that supports Structured Outputs for
`AI_INTENT_MODEL`. A practical current starting point is `gpt-5.4-mini`, whose
documented default reasoning effort is `none`; no large reasoning model is
required. `AI_ANSWER_MODEL` can be the same or a separately chosen compatible
model. No hosted model is silently selected in code. This adapter does not set
reasoning effort: use models whose defaults fit the small token budget and
check real outputs before deployment. Reasoning tokens also consume the output
budget; a model that spends it reasoning may return incomplete output and fail
safely. Availability, pricing and latency depend on the account/model, not this app.

The OpenRouter implementation uses the OpenAI-compatible chat-completions API
at the fixed endpoint `https://openrouter.ai/api/v1/chat/completions`. It accepts
`openrouter/free` or any explicitly configured OpenRouter model ID. Intent
requests retain the compact JSON-only prompt but deliberately do not depend on
optional model-specific schema support: the adapter accepts either one bare JSON
document or one whole fenced `json` document, parses it as JSON, and passes it
through the same strict NeerDrishti intent parser and entity validation. Preamble,
suffix text, partial JSON, multiple choices, tool calls and truncated completions
fail safely. The browser never calls OpenRouter and OpenRouter never receives a
Supabase credential or executable database capability.

OpenRouter-specific attribution headers are optional and are not sent. The fixed
endpoint is intentional; no arbitrary base URL is accepted. The free router's
underlying model, limits and data policy can vary, so verify the selected deployment
policy and do not treat a successful model response as a substitute for grounding.

Implementation references: [Responses migration / text formatting](https://developers.openai.com/api/docs/guides/migrate-to-responses),
[Structured Outputs requirements and refusals](https://developers.openai.com/api/docs/guides/structured-outputs),
[GPT-5.4 mini model](https://developers.openai.com/api/docs/models/gpt-5.4-mini),
[OpenRouter chat completions](https://openrouter.ai/docs/api/api-reference/chat/send-chat-completion-request),
and [OpenRouter free router](https://openrouter.ai/openrouter/free).

## Configuration

Set these in the deployment platform's server secret/environment settings, never
`NEXT_PUBLIC_*`, committed files or browser code:

```env
AI_PROVIDER=hosted
AI_API_KEY=<set securely in deployment settings>
AI_INTENT_MODEL=gpt-5.4-mini
AI_ANSWER_MODEL=gpt-5.4-mini
AI_INTENT_TIMEOUT_MS=10000
AI_ANSWER_TIMEOUT_MS=15000
AI_INTENT_MAX_TOKENS=256
AI_ANSWER_MAX_TOKENS=512
```

OpenRouter free-router example:

```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=<set securely in deployment settings>
OPENROUTER_INTENT_MODEL=openrouter/free
OPENROUTER_ANSWER_MODEL=openrouter/free
AI_INTENT_TIMEOUT_MS=10000
AI_ANSWER_TIMEOUT_MS=15000
```

The key above is a placeholder, not a credential. `.env.example` contains names
and safe comments only. Existing `.env.local` has not been edited.

| Variable | Behavior |
| --- | --- |
| `AI_PROVIDER` | `ollama`, `hosted`, or `openrouter`. Default: Ollama outside production, hosted in production. Invalid selection is unconfigured, never silently switched. |
| `AI_API_KEY` | Server-only hosted key; required for hosted requests. |
| `AI_INTENT_MODEL` | Required for hosted; local falls back to `OLLAMA_MODEL`, then `gemma3:4b`. |
| `AI_ANSWER_MODEL` | Defaults to the resolved intent model. |
| `OPENROUTER_API_KEY` | Server-only OpenRouter key; required only for `AI_PROVIDER=openrouter`. |
| `OPENROUTER_INTENT_MODEL` | Required for OpenRouter; supports `openrouter/free` or an explicit model ID. |
| `OPENROUTER_ANSWER_MODEL` | Optional; defaults to the OpenRouter intent model. |
| `AI_INTENT_TIMEOUT_MS`, `AI_ANSWER_TIMEOUT_MS` | Integer 1,000–120,000 ms each; defaults hosted 10,000/15,000, Ollama 30,000/30,000. |
| `AI_INTENT_MAX_TOKENS`, `AI_ANSWER_MAX_TOKENS` | Defaults 256/512; bounds 128–1,024 and 128–2,048. |
| `OLLAMA_BASE_URL`, `OLLAMA_MODEL` | Existing local settings retained; defaults localhost:11434 / gemma3:4b. |
| `OLLAMA_TIMEOUT_MS` | Legacy local shared timeout, used only if a stage override is unset/blank. |
| `OLLAMA_KEEP_ALIVE` | `1m`–`60m`, default `10m`. |

Malformed numeric settings use bounded defaults. Missing provider-specific key/model or
invalid endpoint/model configuration fails safely before any HTTP request;
deterministic fast paths and grounded formatting fallback remain usable.
`modelConfigured` means syntactically configured, not proof of reachability.
Explicit production Ollama rejects HTTP, localhost and common private IPv4
endpoints. Supported hosted deployment workflows are OpenAI or OpenRouter, not a
local Ollama process, LAN connection, laptop or manual tunnel.

## Latency and payload policy

- Ollama sends `keep_alive`, temperature 0 for intent / 0.2 for answers and
  independent `num_predict` limits. No perpetual warm-up process or paid probe.
- Planner prompt: repetition removed; now 2,635 characters, retaining mappings,
  boundaries and examples. Only question and minimal verified context are sent.
- Final context contains one relevant structured result, not the dataset,
  catalog or transcript. Assessment bookkeeping is omitted but water metrics,
  units and missing values are preserved. Above 16,000 characters, use full
  deterministic formatting instead of truncating evidence.
- Fast paths still precede inference. Classification/count assertions and
  focused metrics are formatted without a final model call, even if the planner
  resolved their action. Mixed districts retain distributions, not one category.

## Timeouts, retries and fallback

Each stage has one abort deadline covering HTTP, response-body reads, backoff
and any retry. OpenAI and OpenRouter get at most one retry for a network failure, 429 or 5xx.
HTTP retries wait at least 150 ms; a Retry-After over one second returns a clean
failure rather than holding the request open or retrying too early. The retry
does not receive a fresh timeout. Ollama has no retry. There are at most two
logical stages / four hosted HTTP attempts and one factual action, all read-only.

Never retry authentication errors, other 4xx, invalid JSON/intent, unsupported
questions, malformed/incomplete results or application validation failures.
Error bodies and exceptions are not forwarded or logged. Safe codes distinguish
`AI_NOT_CONFIGURED`, `AI_UNAVAILABLE`, `AI_TIMEOUT`,
`AI_AUTHENTICATION_FAILED`, `AI_RATE_LIMITED`, `AI_PROVIDER_ERROR` and
`AI_MALFORMED_RESPONSE`. These are request diagnostics; there is no public
credential/health endpoint or extra inference call merely to probe availability.

If no safe intent is available, the response has no factual action or invented
measurements. If the database query succeeded and answer formatting fails,
the user still receives a deterministic answer built from that query result,
with `grounded: true` and `fallback_used: true`. Query failures remain safe
errors, never model guesses. A grounding flag indicates the approved evidence
path, not a mathematical guarantee that model prose is correct; deterministic
Explorer/Analytics remain the direct data surfaces.

## Telemetry, deployment and verification

Response timings include `provider`, `fast_path_used`, `fallback_used`,
`intent_ms`, `db_ms`, `generation_ms`, `total_ms` and `resolution`. No keys,
models, endpoints, prompts or authentication tokens are serialized. Development
logs contain only timing fields; production logging remains disabled. Numeric
`Server-Timing` is retained; its total also includes authentication/route work.

Deploy as a Node.js Next server with outbound HTTPS to the selected hosted provider and Supabase.
Keep existing Supabase/Auth/RLS settings unchanged. Set server environment
variables and restart/redeploy. Allow the route runtime more than the combined
stage budgets plus Supabase/authentication time (default inference budget is
25 seconds); adjust both budgets and the host's function-duration setting
together. Do not deploy this route as a static export or put provider keys in
client build variables. Keep the hosted project billing/quota under your control.

Run without any paid API usage:

```text
node scripts/validate-ai-provider.mjs
node --env-file=.env.local scripts/validate-ai-engine.mjs
node --env-file=.env.local scripts/validate-ai-conversation.mjs --live
node scripts/validate-chat-ui.mjs
node --env-file=.env.local scripts/validate-groundwater-query-layer.mjs
npx tsc --noEmit
npm run lint
npm run build
git diff --check
```

Provider tests inject all HTTP, including fixture Supabase reads through the
real engine/query layer. Existing conversation tests use real configured
Supabase data and mocked Ollama failures. Live validators force Ollama and never
use a hosted key. OpenAI and OpenRouter tests inject fixture HTTP only. Ollama
cases skip explicitly if the service is unavailable.

After configuring real hosted credentials, manually sign in and check the typo
Mumbai classification, a broader planner-required category question, Indapur
summary → extraction follow-up, prediction rejection and forced formatter
failure in a test environment. Verify the source panel and single safe error
message. Inspect `/api/chat` timings; browser traffic must not call OpenAI or OpenRouter.
Without signing in, `/api/chat` must return 401. Check that keys are absent
from network responses, client assets and logs. Never paste real keys into a report.

## Measured results

Ticket 26 reference samples (not new measurements): direct classification
360.4 ms, follow-up classification 885.6 ms, broader local planner 19,727.4 ms.
Current-run measurements follow. Mock timings are not hosted latency measurements.

Measured locally on 2026-10-16 against current Supabase data (milliseconds):

| Request | Intent | Database | Generation | Total |
| --- | ---: | ---: | ---: | ---: |
| Mumbai typo/status fast path | 2.5 | 324.6 | 0 | 327.3 |
| Classification follow-up after Mumbai | 4.6 | 343.7 | 0 | 348.7 |
| Extraction follow-up after Indapur | 3.4 | 341.7 | 0 | 345.3 |
| Broader Mumbai category through Gemma | 22,877.6 | 579.3 | 0 | 23,457.6 |
| First live Mumbai summary after starting Ollama | 1.0 | 334.6 | 37,747.7 | 38,083.4 |
| State classification distribution (two model stages) | 17,019.8 | 1,005.4 | 23,444.4 | 41,471.7 |
| Top extraction units in Pune (two model stages) | 20,024.2 | 685.0 | 55,864.8 | 76,574.9 |

These are samples, not controlled benchmarks or a claim of local speedup.
CPU/build/database contention and cold loading affect timings. The live smoke
validators used an explicit 60-second stage timeout to observe complete model
responses; normal local defaults remain 30 seconds, so slow answer formatting
will instead return a grounded fallback. Measured local planning remains the
bottleneck (roughly 17–23 seconds here); a shorter prompt and residency setting
alone did not establish a speed improvement over Ticket 26's sample.

Ollama was initially offline. A temporary local service used the already-installed
`gemma3:4b`, without downloading any model. All six live engine smoke cases and
three live conversational cases passed. The temporary service was stopped after
testing. No hosted key or hosted models were configured, so hosted timing and
live hosted compatibility were **not measured**; the OpenAI and OpenRouter
adapters passed mocked tests only. No paid API calls were made.

Additional checks passed: TypeScript, lint, production build, provider fixtures,
AI/conversation/Chat/query validators and Analytics/Explorer/Map/Auth/Admin/CSV
regressions. The built production server returned 401 for unsigned `/api/chat`
and 307 for protected `/app/chat`. Client chunk scanning found no hosted endpoint,
AI key-variable name, intent-model setting or service-role key-variable name.
Authenticated hosted browser behavior still needs the manual deployment checks
above. Existing unrelated changes were preserved; no commit was made.

## Ticket 27 file manifest

Created:

- `lib/ai/ai-provider.server.ts`: server-only configuration and provider adapters.
- `lib/ai/groundwater-answer-context.ts`: bounded query-result projection.
- `scripts/ai-test-runtime.mjs`: CLI-only server-marker resolver.
- `scripts/validate-ai-provider.mjs`: credential-free provider/engine tests.
- `docs/production-ai-provider.md`: production setup, failure policy and results.

Updated:

- `lib/ai/local-groundwater-engine.server.ts`: provider interface and telemetry.
- `lib/ai/groundwater-intent-prompt.ts`: concise mappings and examples.
- `lib/ai/groundwater-intent.ts`: provider-neutral error wording only.
- `lib/ai/groundwater-fallback.ts`: provider-neutral fallback wording only.
- `app/api/chat/route.ts`: explicit Node.js runtime; auth/timing retained.
- `app/app/chat/chat-client.tsx`: accept provider metadata and neutral wording.
- `scripts/validate-ai-engine.mjs`, `scripts/validate-ai-conversation.mjs`,
  `scripts/validate-chat-ui.mjs`: provider-compatible regression assertions.
- `docs/local-ai-engine.md`: local settings, payload/token policy and tests.
- `.env.example`: blank variable names and safe comments, no real values.
- `.gitignore`: permit only `.env.example`; real `.env*` files stay ignored.

## Ticket 27B OpenRouter extension

Ticket 27B added the third provider without changing the engine, action allowlist,
query executor or fallback path. It updated `lib/ai/ai-provider.server.ts`, the
client metadata union, `.env.example`, provider/Chat/performance/hardening tests,
README and provider/security documentation. The real `.env.local` remains unchanged,
no live OpenRouter request was made, and no commit was created.
