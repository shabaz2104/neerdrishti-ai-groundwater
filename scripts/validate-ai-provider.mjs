import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import "./ai-test-runtime.mjs";

const { createAiProvider, readAiProviderConfig, hostedIntentSchema, OpenAiProvider, OpenRouterProvider, OllamaProvider } = await import("../lib/ai/ai-provider.server.ts");
const { GROUNDWATER_INTENT_JSON_SCHEMA: schema, GROUNDWATER_INTENT_PROMPT } = await import("../lib/ai/groundwater-intent-prompt.ts");
const { parseGroundwaterIntent } = await import("../lib/ai/groundwater-intent.ts");
const { buildGroundwaterAnswerContext, MAX_ANSWER_CONTEXT_CHARS } = await import("../lib/ai/groundwater-answer-context.ts");
const { answerGroundwaterQuestion } = await import("../lib/ai/local-groundwater-engine.server.ts");

// Dummy values, and an injected fetcher for EVERY HTTP operation. No paid calls.
const secret = "TEST_ONLY_SECRET_SENTINEL";
const env = { NODE_ENV: "production", AI_PROVIDER: "hosted", AI_API_KEY: secret, AI_INTENT_MODEL: "test-intent", AI_ANSWER_MODEL: "test-answer" };
const openRouterEnv = { NODE_ENV: "production", AI_PROVIDER: "openrouter", OPENROUTER_API_KEY: secret, OPENROUTER_INTENT_MODEL: "openrouter/free", OPENROUTER_ANSWER_MODEL: "vendor/free-answer" };
const messages = [{ role: "user", content: "test question" }];
const config = readAiProviderConfig(env);
const openRouterConfig = readAiProviderConfig(openRouterEnv);
const complete = (text) => ({ status: "completed", output: [{ type: "message", role: "assistant", status: "completed", content: [{ type: "output_text", text }] }] });
const response = (text) => Response.json(complete(text));
const openRouterResponse = (text, finishReason = "stop", message = {}) => Response.json({
  id: "test-completion", object: "chat.completion",
  choices: [{ index: 0, finish_reason: finishReason, message: { role: "assistant", content: text, ...message } }],
});
const intentText = JSON.stringify({ action: "getDistrictSummary", arguments: { district: "Mumbai", assessmentUnit: null, year: 2024, limit: null, topic: "classification", proposedClassification: null } });
const openRouterIntentText = JSON.stringify({ action: "getDistrictSummary", arguments: { district: "Mumbai", year: 2024, topic: "classification" } });
let attempts = 0;
const fake = (impl) => async (...args) => { attempts++; return impl(...args); };
const answer = async (fetcher, overrides = {}) => { attempts = 0; return new OpenAiProvider({ ...config, ...overrides }, fake(fetcher)).generateAnswer(messages); };
const openRouterAnswer = async (fetcher, overrides = {}) => { attempts = 0; return new OpenRouterProvider({ ...openRouterConfig, ...overrides }, fake(fetcher)).generateAnswer(messages); };
const safeFailure = (result, code) => { assert.equal(result.ok, false); assert.equal(result.code, code); assert.ok(!JSON.stringify(result).includes(secret)); };

assert.equal(readAiProviderConfig({ NODE_ENV: "development" }).name, "ollama");
assert.equal(readAiProviderConfig({ NODE_ENV: "development" }).intentModel, "gemma3:4b");
assert.equal(readAiProviderConfig({ NODE_ENV: "development" }).intentTimeoutMs, 30000);
assert.equal(readAiProviderConfig({ NODE_ENV: "production" }).name, "hosted");
assert.equal(readAiProviderConfig({ NODE_ENV: "production" }).configured, false);
assert.equal(readAiProviderConfig({ ...env, AI_PROVIDER: "invalid" }).configured, false);
assert.equal(readAiProviderConfig({ NODE_ENV: "production", AI_PROVIDER: "ollama" }).configured, false);
assert.equal(readAiProviderConfig({ NODE_ENV: "production", AI_PROVIDER: "ollama", OLLAMA_BASE_URL: "http://192.168.1.1:11434" }).configured, false);
assert.equal(config.baseUrl, "https://api.openai.com/v1/responses");
assert.equal(config.configured, true);
assert.equal(readAiProviderConfig({ ...env, AI_API_KEY: "" }).configured, false);
assert.equal(readAiProviderConfig({ ...env, AI_INTENT_MODEL: "" }).configured, false);
assert.equal(openRouterConfig.name, "openrouter");
assert.equal(openRouterConfig.baseUrl, "https://openrouter.ai/api/v1/chat/completions");
assert.equal(openRouterConfig.intentModel, "openrouter/free");
assert.equal(openRouterConfig.answerModel, "vendor/free-answer");
assert.equal(openRouterConfig.configured, true);
assert.equal(readAiProviderConfig({ ...openRouterEnv, OPENROUTER_API_KEY: "" }).configured, false);
assert.equal(readAiProviderConfig({ ...openRouterEnv, OPENROUTER_INTENT_MODEL: "" }).configured, false);
assert.equal(readAiProviderConfig({ NODE_ENV: "production", AI_PROVIDER: "openrouter", AI_API_KEY: secret, AI_INTENT_MODEL: "wrong-provider-model" }).configured, false);
assert.equal(readAiProviderConfig({ ...env, AI_INTENT_TIMEOUT_MS: "-1", AI_ANSWER_MAX_TOKENS: "99999" }).intentTimeoutMs, 10000);
assert.equal(readAiProviderConfig({ OLLAMA_TIMEOUT_MS: "32000" }).answerTimeoutMs, 32000);
assert.equal(readAiProviderConfig({ OLLAMA_TIMEOUT_MS: "32000", AI_INTENT_TIMEOUT_MS: "9000" }).intentTimeoutMs, 9000);
assert.equal(readAiProviderConfig({ OLLAMA_TIMEOUT_MS: "32000", AI_INTENT_TIMEOUT_MS: "", AI_ANSWER_TIMEOUT_MS: "" }).answerTimeoutMs, 32000);
assert.equal(readAiProviderConfig({ OLLAMA_KEEP_ALIVE: "forever" }).keepAlive, "10m");
let requests = [];
const hosted = createAiProvider(env, async (url, init) => { requests.push({ url, init, body: JSON.parse(init.body) }); return response(requests.length === 1 ? intentText : "Grounded example"); });
const planned = await hosted.generateIntent(messages, schema);
assert.equal(planned.ok, true);
assert.deepEqual(JSON.parse(planned.content).arguments, { district: "Mumbai", year: 2024, topic: "classification" });
assert.equal(parseGroundwaterIntent(planned.content).ok, true);
assert.equal((await hosted.generateAnswer(messages)).ok, true);
assert.equal(requests[0].body.model, "test-intent"); assert.equal(requests[1].body.model, "test-answer");
assert.equal(requests[0].body.max_output_tokens, 256); assert.equal(requests[1].body.max_output_tokens, 512);
assert.equal(requests[0].body.store, false);
assert.equal(requests[0].body.text.format.strict, true);
assert.equal(requests[1].body.text, undefined);
for (const req of requests) { assert.equal(req.url, config.baseUrl); assert.equal(req.init.redirect, "error"); assert.equal(req.init.headers.Authorization, `Bearer ${secret}`); assert.ok(!req.init.body.includes(secret)); }
const strict = hostedIntentSchema(schema);
assert.equal(strict.additionalProperties, false);
assert.deepEqual(strict.properties.arguments.required, Object.keys(schema.properties.arguments.properties));
for (const property of Object.values(strict.properties.arguments.properties)) assert.ok(property.type.includes("null"));
assert.ok(strict.properties.arguments.properties.year.enum.includes(null));

let openRouterRequests = [];
const openRouter = createAiProvider(openRouterEnv, async (url, init) => {
  openRouterRequests.push({ url, init, body: JSON.parse(init.body) });
  return openRouterResponse(openRouterRequests.length === 1 ? `\`\`\`json\n${openRouterIntentText}\n\`\`\`` : "Grounded OpenRouter example");
});
assert.equal(openRouter.name, "openrouter");
const openRouterIntent = await openRouter.generateIntent(messages, schema);
assert.equal(openRouterIntent.ok, true);
assert.equal(parseGroundwaterIntent(openRouterIntent.content).ok, true);
assert.equal((await openRouter.generateAnswer(messages)).ok, true);
assert.equal(openRouterRequests[0].url, "https://openrouter.ai/api/v1/chat/completions");
assert.equal(openRouterRequests[0].body.model, "openrouter/free");
assert.equal(openRouterRequests[1].body.model, "vendor/free-answer");
assert.deepEqual(openRouterRequests[0].body.messages, messages);
assert.equal(openRouterRequests[0].body.stream, false);
assert.equal(openRouterRequests[0].body.temperature, 0);
assert.equal(openRouterRequests[1].body.temperature, 0.2);
assert.equal(openRouterRequests[0].body.max_tokens, 256);
assert.equal(openRouterRequests[1].body.max_tokens, 512);
assert.equal(openRouterRequests[0].body.response_format, undefined);
assert.equal(openRouterRequests[0].body.tools, undefined);
for (const req of openRouterRequests) {
  assert.equal(req.init.redirect, "error");
  assert.equal(req.init.headers.Authorization, `Bearer ${secret}`);
  assert.ok(!req.init.body.includes(secret));
}
for (const content of ["not JSON", `Here is the JSON:\n${intentText}`, `${intentText}\nDone.`]) {
  const result = await new OpenRouterProvider(openRouterConfig, async () => openRouterResponse(content)).generateIntent(messages, schema);
  safeFailure(result, "AI_MALFORMED_RESPONSE");
}
const unsafeOpenRouterIntent = await new OpenRouterProvider(openRouterConfig, async () => openRouterResponse('{"action":"runSQL","arguments":{}}')).generateIntent(messages, schema);
assert.equal(unsafeOpenRouterIntent.ok, true);
assert.equal(parseGroundwaterIntent(unsafeOpenRouterIntent.content).ok, false);
for (const responseFactory of [
  () => openRouterResponse("partial", "length"),
  () => openRouterResponse("", "stop"),
  () => openRouterResponse("text", "tool_calls", { tool_calls: [{ id: "evil" }] }),
  () => Response.json({ choices: [] }),
  () => Response.json({ choices: [{ finish_reason: "stop", message: { role: "assistant", content: "one" } }, { finish_reason: "stop", message: { role: "assistant", content: "two" } }] }),
]) safeFailure(await openRouterAnswer(responseFactory), "AI_MALFORMED_RESPONSE");
safeFailure(await openRouterAnswer(() => new Response(secret, { status: 401 })), "AI_AUTHENTICATION_FAILED"); assert.equal(attempts, 1);
safeFailure(await openRouterAnswer(() => new Response(secret, { status: 429 })), "AI_RATE_LIMITED"); assert.equal(attempts, 2);
safeFailure(await openRouterAnswer(() => { throw new Error(secret); }), "AI_UNAVAILABLE"); assert.equal(attempts, 2);
for (const bad of ["not JSON", '{"action":"runSQL","arguments":{}}', '{"action":"getDistrictSummary","arguments":{"district":"Mumbai","shell":null}}']) {
  const provider = createAiProvider(env, async () => response(bad));
  const result = await provider.generateIntent(messages, schema);
  assert.ok(!result.ok || !parseGroundwaterIntent(result.content).ok);
}

for (const [status, code, count] of [[401,"AI_AUTHENTICATION_FAILED",1],[403,"AI_AUTHENTICATION_FAILED",1],[400,"AI_PROVIDER_ERROR",1],[429,"AI_RATE_LIMITED",2],[500,"AI_UNAVAILABLE",2],[503,"AI_UNAVAILABLE",2]]) {
  safeFailure(await answer(() => new Response(secret, { status })), code);
  assert.equal(attempts, count, `retry count for ${status}`);
}
safeFailure(await answer(() => new Response(secret, { status: 429, headers: { "retry-after": "30" } })), "AI_RATE_LIMITED"); assert.equal(attempts, 1);
safeFailure(await answer(() => new Response(secret, { status: 429, headers: { "retry-after": new Date(Date.now() + 30000).toUTCString() } })), "AI_RATE_LIMITED"); assert.equal(attempts, 1);
safeFailure(await answer(() => { throw new Error(secret); }), "AI_UNAVAILABLE"); assert.equal(attempts, 2);
assert.equal((await answer(() => attempts === 1 ? new Response("", { status: 503 }) : response("Recovered"))).ok, true); assert.equal(attempts, 2);
safeFailure(await answer(() => new Response("not-json")), "AI_MALFORMED_RESPONSE"); assert.equal(attempts, 1);
for (const payload of [{}, { ...complete("partial"), status: "incomplete" }, { status: "completed", output: [{ ...complete("partial").output[0], status: "incomplete" }] }, complete(""), complete("x".repeat(12001)), { status: "completed", output: [{ type: "function_call", name: "evil" }] }, { status: "completed", output: [{ type: "message", role: "assistant", status: "completed", content: [{ type: "refusal", refusal: secret }] }] }]) {
  safeFailure(await answer(() => Response.json(payload)), "AI_MALFORMED_RESPONSE"); assert.equal(attempts, 1);
}
const pending = (_url, init) => new Promise((_resolve, reject) => { const abort = () => reject(new DOMException("aborted", "AbortError")); init.signal.addEventListener("abort", abort, { once: true }); if (init.signal.aborted) abort(); });
safeFailure(await answer(pending, { answerTimeoutMs: 20 }), "AI_TIMEOUT"); assert.equal(attempts, 1);
safeFailure(await openRouterAnswer(pending, { answerTimeoutMs: 20 }), "AI_TIMEOUT"); assert.equal(attempts, 1);
safeFailure(await new OpenAiProvider({ ...config, intentTimeoutMs: 20 }, pending).generateIntent(messages, schema), "AI_TIMEOUT");
safeFailure(await answer(async (url, init) => ({ ok: true, json: () => pending(url, init) }), { answerTimeoutMs: 20 }), "AI_TIMEOUT");
safeFailure(await answer(() => new Response("", { status: 503 }), { answerTimeoutMs: 20 }), "AI_TIMEOUT"); assert.equal(attempts, 1, "retry wait shares the original deadline");
safeFailure(await new OpenAiProvider({ ...config, configured: false }, () => assert.fail("unconfigured fetch")).generateAnswer(messages), "AI_NOT_CONFIGURED");
safeFailure(await new OpenRouterProvider({ ...openRouterConfig, configured: false }, () => assert.fail("unconfigured fetch")).generateAnswer(messages), "AI_NOT_CONFIGURED");
let localBody;
const localConfig = readAiProviderConfig({ AI_PROVIDER: "ollama", OLLAMA_MODEL: "gemma3:4b", AI_ANSWER_MODEL: "other-local", OLLAMA_KEEP_ALIVE: "15m" });
const local = new OllamaProvider(localConfig, async (_url, init) => { localBody = JSON.parse(init.body); assert.equal(init.headers.Authorization, undefined); return Response.json({ done: true, message: { content: "{}" } }); });
assert.equal((await local.generateIntent(messages, schema)).ok, true);
assert.equal(localBody.model, "gemma3:4b"); assert.equal(localBody.keep_alive, "15m"); assert.equal(localBody.options.temperature, 0); assert.equal(localBody.options.num_predict, 256); assert.deepEqual(localBody.format, schema);
await local.generateAnswer(messages); assert.equal(localBody.model, "other-local"); assert.equal(localBody.options.num_predict, 512); assert.equal(localBody.format, undefined);
for (const payload of [{ done: false, message: { content: "partial" } }, { done: true, done_reason: "length", message: { content: "partial" } }, { message: { content: "missing completion marker" } }, { message: { content: "" } }]) safeFailure(await new OllamaProvider(localConfig, async () => Response.json(payload)).generateAnswer(messages), "AI_MALFORMED_RESPONSE");
attempts = 0;
safeFailure(await new OllamaProvider(localConfig, fake(() => { throw new Error(secret); })).generateAnswer(messages), "AI_UNAVAILABLE"); assert.equal(attempts, 1);
safeFailure(await new OllamaProvider({ ...localConfig, answerTimeoutMs: 20 }, pending).generateAnswer(messages), "AI_TIMEOUT");
const assessmentIntent = { action: "getAssessment", arguments: { district: "Pune", assessmentUnit: "Indapur", year: 2024 } };
const compact = JSON.parse(buildGroundwaterAnswerContext("details", assessmentIntent, { district: "Pune", extraction: 12.3, stage_of_groundwater_extraction_percent: null, id: "omit", source_document: "omit", created_at: "omit" }));
assert.equal(compact.result.extraction, 12.3); assert.equal(compact.result.stage_of_groundwater_extraction_percent, null); assert.equal(compact.result.id, undefined); assert.equal(compact.result.source_document, undefined);
assert.equal(buildGroundwaterAnswerContext("details", assessmentIntent, { extraction: "x".repeat(MAX_ANSWER_CONTEXT_CHARS) }), null);

// Exercise the REAL engine, intent validator and query layer over fixture HTTP.
// Block every unrecognized host; never connect to Supabase or a paid provider.
const savedEnv = { ...process.env };
const savedFetch = globalThis.fetch;
let providerCalls = 0, factualReads = 0, catalogReads = 0, mode = "offline";
Object.assign(process.env, env, { NEXT_PUBLIC_SUPABASE_URL: "https://fixture.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "TEST_ONLY_DATABASE_SECRET" });
const fixture = { district: "Mumbai", assessment_unit: "Mumbai Unit", year: 2024, recharge: 12.5, annual_extractable_groundwater_resource: 10, extraction: 4, net_groundwater_availability_for_future_use: 6, classification: "safe" };
globalThis.fetch = async (input, init) => {
  const url = new URL(String(input));
  if (url.origin === "https://fixture.supabase.co") {
    assert.equal(init?.method ?? "GET", "GET", "all DB operations must be read-only");
    if (url.searchParams.get("select") === "district,assessment_unit") catalogReads++; else factualReads++;
    return Response.json([fixture]);
  }
  assert.equal(url.href, config.baseUrl, "unexpected external network operation");
  providerCalls++;
  assert.ok(!init.body.includes("TEST_ONLY_DATABASE_SECRET"));
  if (mode === "offline") throw new Error(secret);
  if (mode === "invalid") return response('{"action":"runSQL","arguments":{}}');
  if (mode === "invalid-json") return response("{partial");
  if (mode === "auth") return new Response(secret, { status: 401 });
  if (mode === "malformed") return Response.json({ status: "incomplete" });
  if (mode === "valid") return response(intentText);
  if (mode === "format-fails") return JSON.parse(init.body).text ? response(JSON.stringify({ action: "getDistrictSummary", arguments: { district: "Mumbai", year: 2024 } })) : new Response(secret, { status: 503 });
  return response("Mumbai: extraction 4 ha-m.");
};
try {
  const fast = await answerGroundwaterQuestion("is mumbai in critcal zone or safe zone");
  assert.equal(fast.grounded, true); assert.equal(providerCalls, 0); assert.equal(fast.metadata.timings.fast_path_used, true); assert.equal(fast.metadata.timings.fallback_used, false);
  const summary = await answerGroundwaterQuestion("Tell me about Mumbai.");
  assert.equal(summary.grounded, true); assert.equal(summary.metadata.timings.fallback_used, true); assert.match(summary.answer, /extraction: 4 ha-m/);
  const beforeFollow = factualReads;
  const follow = await answerGroundwaterQuestion("What is its extraction?", ["Tell me about Mumbai."]);
  assert.equal(follow.grounded, true); assert.match(follow.answer, /4 ha-m/); assert.ok(factualReads > beforeFollow);
  for (const [failureMode, code] of [["offline","AI_UNAVAILABLE"],["invalid","INVALID_AI_INTENT"],["invalid-json","AI_MALFORMED_RESPONSE"],["auth","AI_AUTHENTICATION_FAILED"],["malformed","AI_MALFORMED_RESPONSE"]]) {
    mode = failureMode; providerCalls = 0;
    const before = factualReads;
    const result = await answerGroundwaterQuestion("Could you check the category of Mumbai for me?");
    assert.equal(result.grounded, false); assert.equal(result.error.code, code); assert.equal(factualReads, before, "unsafe intent cannot execute a factual action");
    assert.equal(providerCalls, mode === "offline" ? 2 : 1);
    assert.ok(!JSON.stringify(result).includes(secret)); assert.ok(!JSON.stringify(result).includes("TEST_ONLY_DATABASE_SECRET"));
  }
  mode = "valid";
  const plannedStatus = await answerGroundwaterQuestion("Could you check the category of Mumbai for me?");
  assert.equal(plannedStatus.grounded, true); assert.equal(plannedStatus.metadata.timings.resolution, "planner"); assert.equal(plannedStatus.metadata.timings.generation_ms, 0);
  mode = "format-fails";
  const plannedFallback = await answerGroundwaterQuestion("Could you describe Mumbai's groundwater resources for me?");
  assert.equal(plannedFallback.grounded, true); assert.equal(plannedFallback.metadata.timings.fallback_used, true); assert.match(plannedFallback.answer, /extraction: 4 ha-m/);
  mode = "answer";
  const formatted = await answerGroundwaterQuestion("Tell me about Mumbai.");
  assert.equal(formatted.grounded, true); assert.equal(formatted.metadata.engine, "hosted"); assert.equal(formatted.metadata.timings.fallback_used, false);
  const beforeUnsupported = catalogReads + factualReads + providerCalls;
  assert.equal((await answerGroundwaterQuestion("Predict Pune groundwater in 2030.")).grounded, false);
  assert.equal(catalogReads + factualReads + providerCalls, beforeUnsupported);
  delete process.env.AI_API_KEY;
  const unconfigured = await answerGroundwaterQuestion("Tell me about Mumbai.");
  assert.equal(unconfigured.grounded, true); assert.equal(unconfigured.metadata.modelConfigured, false); assert.equal(unconfigured.metadata.timings.fallback_used, true);
} finally {
  globalThis.fetch = savedFetch;
  for (const key of Object.keys(process.env)) if (!(key in savedEnv)) delete process.env[key];
  Object.assign(process.env, savedEnv);
}
const providerSource = readFileSync(new URL("../lib/ai/ai-provider.server.ts", import.meta.url), "utf8");
assert.match(providerSource, /import "server-only"/);
assert.doesNotMatch(providerSource, /console\.|NEXT_PUBLIC|SUPABASE/);
console.log(`AI provider validation passed: Ollama, OpenAI and OpenRouter selection; strict hosted schema; conservative fenced-JSON normalization; stage budgets; keep_alive; output caps; retry limits; offline/timeout/401/403/429/5xx; malformed/refused/truncated results; no secret leakage; real-engine validation gates; fresh read-only queries and grounded fallback. Planner prompt: ${GROUNDWATER_INTENT_PROMPT.length} characters. No live network or paid calls.`);
