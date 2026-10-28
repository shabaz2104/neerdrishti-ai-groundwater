import "server-only";

export type AiProviderName = "ollama" | "hosted" | "openrouter" | "unconfigured";
export type AiMessage = { role: "system" | "user"; content: string };
export type AiProviderError = "AI_NOT_CONFIGURED" | "AI_UNAVAILABLE" | "AI_TIMEOUT" | "AI_AUTHENTICATION_FAILED" | "AI_RATE_LIMITED" | "AI_PROVIDER_ERROR" | "AI_MALFORMED_RESPONSE";
type AiFailure = { ok: false; code: AiProviderError; message: string };
export type AiGenerationResult = { ok: true; content: string } | AiFailure;
export interface AiProvider {
  readonly name: AiProviderName;
  readonly configured: boolean;
  generateIntent(messages: AiMessage[], schema: unknown): Promise<AiGenerationResult>;
  generateAnswer(messages: AiMessage[]): Promise<AiGenerationResult>;
}

type Stage = "intent" | "answer";
type Environment = Record<string, string | undefined>;
export type AiProviderConfig = {
  name: AiProviderName;
  configured: boolean;
  baseUrl: string;
  apiKey: string;
  intentModel: string;
  answerModel: string;
  intentTimeoutMs: number;
  answerTimeoutMs: number;
  intentMaxTokens: number;
  answerMaxTokens: number;
  keepAlive: string;
};

function bounded(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

/** Configuration is request-scoped and never serialized by the engine. */
export function readAiProviderConfig(env: Environment = process.env): AiProviderConfig {
  const selected = env.AI_PROVIDER?.trim() || (env.NODE_ENV === "production" ? "hosted" : "ollama");
  const name = selected === "hosted" || selected === "ollama" || selected === "openrouter" ? selected : "unconfigured";
  const intentModel = (name === "openrouter"
    ? env.OPENROUTER_INTENT_MODEL || ""
    : env.AI_INTENT_MODEL || (name === "ollama" ? env.OLLAMA_MODEL || "gemma3:4b" : "")).trim();
  const answerModel = (name === "openrouter" ? env.OPENROUTER_ANSWER_MODEL || intentModel : env.AI_ANSWER_MODEL || intentModel).trim();
  const apiKey = (name === "hosted" ? env.AI_API_KEY : name === "openrouter" ? env.OPENROUTER_API_KEY : "")?.trim() || "";
  let baseUrl = name === "hosted"
    ? "https://api.openai.com/v1/responses"
    : name === "openrouter"
      ? "https://openrouter.ai/api/v1/chat/completions"
      : (env.OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/$/, "");
  let validUrl = true;
  try {
    const url = new URL(baseUrl);
    validUrl = ["http:", "https:"].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash;
    if (name === "ollama" && env.NODE_ENV === "production") validUrl = validUrl && url.protocol === "https:" && !/^(localhost|127\.|\[?::1\]?|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(url.hostname);
  } catch { validUrl = false; baseUrl = ""; }
  const clean = (value: string) => !value.includes("\r") && !value.includes("\n") && !value.includes(String.fromCharCode(0));
  const modelValid = (value: string) => value.length > 0 && value.length <= 120 && clean(value);
  const remote = name === "hosted" || name === "openrouter";
  const configured = name !== "unconfigured" && validUrl && modelValid(intentModel) && modelValid(answerModel) &&
    (!remote || (apiKey.length > 0 && clean(apiKey)));
  const legacyTimeout = name === "ollama" ? env.OLLAMA_TIMEOUT_MS : undefined;
  return {
    name, configured, baseUrl, apiKey, intentModel, answerModel,
    intentTimeoutMs: bounded(env.AI_INTENT_TIMEOUT_MS || legacyTimeout, remote ? 10000 : 30000, 1000, 120000),
    answerTimeoutMs: bounded(env.AI_ANSWER_TIMEOUT_MS || legacyTimeout, remote ? 15000 : 30000, 1000, 120000),
    intentMaxTokens: bounded(env.AI_INTENT_MAX_TOKENS, 256, 128, 1024),
    answerMaxTokens: bounded(env.AI_ANSWER_MAX_TOKENS, 512, 128, 2048),
    keepAlive: /^(?:[1-9]|[1-5]\d|60)m$/.test(env.OLLAMA_KEEP_ALIVE || "") ? env.OLLAMA_KEEP_ALIVE! : "10m",
  };
}

const ERROR_MESSAGES: Record<AiProviderError, string> = {
  AI_NOT_CONFIGURED: "The AI service is not configured. Clear supported place questions can still use the structured groundwater data.",
  AI_UNAVAILABLE: "The AI service is currently unavailable. Please try again.",
  AI_TIMEOUT: "The AI service took too long to respond. Please try again.",
  AI_AUTHENTICATION_FAILED: "The AI service could not authenticate. Please contact the application administrator.",
  AI_RATE_LIMITED: "The AI service is busy. Please try again shortly.",
  AI_PROVIDER_ERROR: "The AI service could not process this request. Please try again.",
  AI_MALFORMED_RESPONSE: "The AI service did not return a complete usable response. Please try again.",
};
function failure(code: AiProviderError): AiFailure { return { ok: false, code, message: ERROR_MESSAGES[code] }; }
function object(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }

/** Strict hosted schemas require every key. Null here means an omitted optional argument. */
export function hostedIntentSchema(schema: unknown): unknown {
  if (!object(schema) || !object(schema.properties) || !object(schema.properties.arguments) || !object(schema.properties.arguments.properties)) throw new Error("Invalid application schema");
  const properties = Object.fromEntries(Object.entries(schema.properties.arguments.properties).map(([name, value]) => {
    if (!object(value)) throw new Error("Invalid application schema");
    return [name, { ...value, type: [value.type, "null"], ...(Array.isArray(value.enum) ? { enum: [...value.enum, null] } : {}) }];
  }));
  return { ...schema, properties: { ...schema.properties, arguments: { ...schema.properties.arguments, properties, required: Object.keys(properties) } } };
}

function normalizeHostedIntent(content: string, schema: unknown): string {
  // Only the adapter's known nullable fields can be omitted. Unknown fields and
  // top-level shape are preserved so strict application validation rejects them.
  const parsed: unknown = JSON.parse(content);
  if (object(parsed) && object(parsed.arguments) && object(schema) && object(schema.properties) && object(schema.properties.arguments) && object(schema.properties.arguments.properties)) {
    const known = Object.keys(schema.properties.arguments.properties);
    parsed.arguments = Object.fromEntries(Object.entries(parsed.arguments).filter(([key, value]) => !(value === null && known.includes(key))));
  }
  return JSON.stringify(parsed);
}

type Fetcher = typeof fetch;
type HttpResult = { ok: true; payload: unknown } | AiFailure;

async function requestJson(config: AiProviderConfig, stage: Stage, body: unknown, fetcher: Fetcher): Promise<HttpResult> {
  if (!config.configured) return failure("AI_NOT_CONFIGURED");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), stage === "intent" ? config.intentTimeoutMs : config.answerTimeoutMs);
  const maxAttempts = config.name === "ollama" ? 1 : 2;
  try {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let response: Response;
      try {
        response = await fetcher(config.name === "ollama" ? `${config.baseUrl}/api/chat` : config.baseUrl, {
          method: "POST", redirect: "error", cache: "no-store",
          headers: { "content-type": "application/json", ...(config.name !== "ollama" ? { Authorization: `Bearer ${config.apiKey}` } : {}) },
          body: JSON.stringify(body), signal: controller.signal,
        });
      } catch {
        if (controller.signal.aborted) return failure("AI_TIMEOUT");
        if (attempt + 1 < maxAttempts) continue;
        return failure("AI_UNAVAILABLE");
      }
      if (!response.ok) {
        // Error bodies are never read, logged or forwarded to the browser.
        void response.body?.cancel().catch(() => {});
        if (response.status === 401 || response.status === 403) return failure("AI_AUTHENTICATION_FAILED");
        const transient = response.status === 429 || response.status >= 500;
        if (transient && attempt + 1 < maxAttempts) {
          const retryHeader = response.headers.get("retry-after");
          const retryAfter = retryHeader && !Number.isFinite(Number(retryHeader))
            ? Math.max(0, (Date.parse(retryHeader) - Date.now()) / 1000)
            : Number(retryHeader);
          // Do not hold requests open or ignore long rate-limit instructions.
          if (retryAfter > 1) return failure(response.status === 429 ? "AI_RATE_LIMITED" : "AI_UNAVAILABLE");
          await new Promise<void>((resolve) => {
            const retryTimer = setTimeout(done, Math.max(150, (retryAfter || 0) * 1000));
            function done() { clearTimeout(retryTimer); controller.signal.removeEventListener("abort", done); resolve(); }
            controller.signal.addEventListener("abort", done, { once: true });
            if (controller.signal.aborted) done();
          });
          if (controller.signal.aborted) return failure("AI_TIMEOUT");
          continue;
        }
        return failure(response.status === 429 ? "AI_RATE_LIMITED" : response.status >= 500 ? "AI_UNAVAILABLE" : "AI_PROVIDER_ERROR");
      }
      try { return { ok: true, payload: await response.json() }; }
      catch { return failure(controller.signal.aborted ? "AI_TIMEOUT" : "AI_MALFORMED_RESPONSE"); }
    }
    return failure("AI_UNAVAILABLE");
  } finally { clearTimeout(timeout); }
}

function usable(content: unknown, stage: Stage): content is string { return typeof content === "string" && content.trim().length > 0 && content.length <= (stage === "intent" ? 4000 : 12000); }

export class OllamaProvider implements AiProvider {
  readonly name = "ollama" as const;
  get configured() { return this.config.configured; }
  private readonly config: AiProviderConfig;
  private readonly fetcher: Fetcher;
  constructor(config: AiProviderConfig, fetcher: Fetcher = (input, init) => fetch(input, init)) { this.config = config; this.fetcher = fetcher; }
  private async generate(stage: Stage, messages: AiMessage[], schema?: unknown): Promise<AiGenerationResult> {
    const result = await requestJson(this.config, stage, {
      model: stage === "intent" ? this.config.intentModel : this.config.answerModel, messages,
      stream: false, keep_alive: this.config.keepAlive,
      options: { temperature: stage === "intent" ? 0 : 0.2, num_predict: stage === "intent" ? this.config.intentMaxTokens : this.config.answerMaxTokens },
      ...(schema ? { format: schema } : {}),
    }, this.fetcher);
    if (!result.ok) return result;
    const payload = result.payload;
    if (!object(payload) || payload.done !== true || payload.done_reason === "length" || !object(payload.message) || !usable(payload.message.content, stage)) return failure("AI_MALFORMED_RESPONSE");
    return { ok: true, content: payload.message.content.trim() };
  }
  generateIntent(messages: AiMessage[], schema: unknown) { return this.generate("intent", messages, schema); }
  generateAnswer(messages: AiMessage[]) { return this.generate("answer", messages); }
}

export class OpenAiProvider implements AiProvider {
  readonly name = "hosted" as const;
  get configured() { return this.config.configured; }
  private readonly config: AiProviderConfig;
  private readonly fetcher: Fetcher;
  constructor(config: AiProviderConfig, fetcher: Fetcher = (input, init) => fetch(input, init)) { this.config = config; this.fetcher = fetcher; }
  private async generate(stage: Stage, messages: AiMessage[], schema?: unknown): Promise<AiGenerationResult> {
    const result = await requestJson(this.config, stage, {
      model: stage === "intent" ? this.config.intentModel : this.config.answerModel,
      input: messages, store: false,
      max_output_tokens: stage === "intent" ? this.config.intentMaxTokens : this.config.answerMaxTokens,
      ...(schema ? { text: { format: { type: "json_schema", name: "groundwater_intent", strict: true, schema: hostedIntentSchema(schema) } } } : {}),
    }, this.fetcher);
    if (!result.ok) return result;
    const payload = result.payload;
    if (!object(payload) || payload.status !== "completed" || !Array.isArray(payload.output)) return failure("AI_MALFORMED_RESPONSE");
    const parts: string[] = [];
    for (const item of payload.output) {
      if (!object(item)) return failure("AI_MALFORMED_RESPONSE");
      if (item.type === "reasoning") continue;
      if (item.type !== "message" || item.role !== "assistant" || item.status !== "completed" || !Array.isArray(item.content)) return failure("AI_MALFORMED_RESPONSE");
      for (const part of item.content) {
        if (!object(part) || part.type !== "output_text" || typeof part.text !== "string") return failure("AI_MALFORMED_RESPONSE");
        parts.push(part.text);
      }
    }
    const content = parts.join("").trim();
    if (!usable(content, stage)) return failure("AI_MALFORMED_RESPONSE");
    try { return { ok: true, content: stage === "intent" ? normalizeHostedIntent(content, schema) : content }; }
    catch { return failure("AI_MALFORMED_RESPONSE"); }
  }
  generateIntent(messages: AiMessage[], schema: unknown) { return this.generate("intent", messages, schema); }
  generateAnswer(messages: AiMessage[]) { return this.generate("answer", messages); }
}

function normalizeOpenRouterIntent(content: string): string {
  const trimmed = content.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  const candidate = (fenced?.[1] ?? trimmed).trim();
  return JSON.stringify(JSON.parse(candidate));
}

export class OpenRouterProvider implements AiProvider {
  readonly name = "openrouter" as const;
  get configured() { return this.config.configured; }
  private readonly config: AiProviderConfig;
  private readonly fetcher: Fetcher;
  constructor(config: AiProviderConfig, fetcher: Fetcher = (input, init) => fetch(input, init)) { this.config = config; this.fetcher = fetcher; }
  private async generate(stage: Stage, messages: AiMessage[]): Promise<AiGenerationResult> {
    const result = await requestJson(this.config, stage, {
      model: stage === "intent" ? this.config.intentModel : this.config.answerModel,
      messages, stream: false, temperature: stage === "intent" ? 0 : 0.2,
      max_tokens: stage === "intent" ? this.config.intentMaxTokens : this.config.answerMaxTokens,
    }, this.fetcher);
    if (!result.ok) return result;
    const payload = result.payload;
    if (!object(payload) || !Array.isArray(payload.choices) || payload.choices.length !== 1) return failure("AI_MALFORMED_RESPONSE");
    const choice = payload.choices[0];
    if (!object(choice) || choice.finish_reason !== "stop" || !object(choice.message) || choice.message.role !== "assistant" ||
      choice.message.tool_calls !== undefined || choice.message.function_call !== undefined || !usable(choice.message.content, stage)) {
      return failure("AI_MALFORMED_RESPONSE");
    }
    const content = choice.message.content.trim();
    if (stage === "answer") return { ok: true, content };
    try { return { ok: true, content: normalizeOpenRouterIntent(content) }; }
    catch { return failure("AI_MALFORMED_RESPONSE"); }
  }
  async generateIntent(messages: AiMessage[]) {
    const first = await this.generate("intent", messages);
    // The free router can select models with different formatting behavior.
    // Retry one malformed planner response, but never relax JSON or intent validation.
    return !first.ok && first.code === "AI_MALFORMED_RESPONSE"
      ? this.generate("intent", messages)
      : first;
  }
  generateAnswer(messages: AiMessage[]) { return this.generate("answer", messages); }
}

export function createAiProvider(env: Environment = process.env, fetcher?: Fetcher): AiProvider {
  const config = readAiProviderConfig(env);
  if (config.name === "ollama") return new OllamaProvider(config, fetcher);
  if (config.name === "hosted") return new OpenAiProvider(config, fetcher);
  if (config.name === "openrouter") return new OpenRouterProvider(config, fetcher);
  const unavailable = async () => failure("AI_NOT_CONFIGURED");
  return { name: "unconfigured", configured: false, generateIntent: unavailable, generateAnswer: unavailable };
}
