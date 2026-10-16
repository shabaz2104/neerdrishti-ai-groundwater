import assert from "node:assert/strict";
import "./ai-test-runtime.mjs";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function read(relativePath) {
  const absolutePath = resolve(root, relativePath);
  assert.ok(existsSync(absolutePath), `missing AI-engine file: ${relativePath}`);
  return readFileSync(absolutePath, "utf8");
}

function report(message) {
  console.log(`[ai-validation] ${message}`);
}

const toolSource = read("lib/ai/groundwater-tools.server.ts");
const intentSource = read("lib/ai/groundwater-intent.ts");
const intentPromptSource = read("lib/ai/groundwater-intent-prompt.ts");
const engineSource = read("lib/ai/local-groundwater-engine.server.ts");
const providerSource = read("lib/ai/ai-provider.server.ts");
const fallbackSource = read("lib/ai/groundwater-fallback.ts");
const promptSource = read("lib/ai/groundwater-system-prompt.ts");
const routeSource = read("app/api/chat/route.ts");
const packageSource = read("package.json");
const envExampleSource = read(".env.example");
const docsSource = read("docs/local-ai-engine.md");

const {
  APPROVED_GROUNDWATER_TOOL_NAMES,
  validateToolArguments,
} = await import("../lib/ai/tool-arguments.ts");
const { parseGroundwaterIntent } = await import("../lib/ai/groundwater-intent.ts");
const { formatGroundwaterFallback } = await import("../lib/ai/groundwater-fallback.ts");
const { answerGroundwaterQuestion, LOCAL_AI_ENGINE_LIMITS } = await import(
  "../lib/ai/local-groundwater-engine.server.ts"
);

assert.deepEqual(APPROVED_GROUNDWATER_TOOL_NAMES, [
  "getDistricts",
  "getAssessmentUnits",
  "getAssessment",
  "getDistrictSummary",
  "getClassificationSummary",
  "getTopExtractionAreas",
  "getOverallSummary",
  "getDistrictComparison",
]);
report("eight approved groundwater actions exist");

const validIntent = parseGroundwaterIntent(
  JSON.stringify({
    action: "getDistrictSummary",
    arguments: { district: "Pune", year: 2024 },
  }),
);
assert.equal(validIntent.ok, true);
const unknownIntent = parseGroundwaterIntent(
  JSON.stringify({ action: "runArbitraryCode", arguments: {} }),
);
assert.equal(unknownIntent.ok, false);
const unknownArgumentIntent = parseGroundwaterIntent(
  JSON.stringify({
    action: "getDistrictSummary",
    arguments: { district: "Pune", shell: "whoami" },
  }),
);
assert.equal(unknownArgumentIntent.ok, false);
const malformedIntent = parseGroundwaterIntent("not-json");
assert.equal(malformedIntent.ok, false);
const unsupportedYearIntent = parseGroundwaterIntent(
  JSON.stringify({
    action: "getDistrictSummary",
    arguments: { district: "Pune", year: 2018 },
  }),
);
assert.equal(unsupportedYearIntent.ok, false);
assert.equal(unsupportedYearIntent.code, "UNSUPPORTED_YEAR");
assert.equal(validateToolArguments("getDistricts", { sql: "select *" }).error, "getDistricts does not accept arguments.");
assert.equal(validateToolArguments("getTopExtractionAreas", { limit: 101 }).error, "limit must be an integer between 1 and 100.");
report("structured intent and function arguments are independently validated");

const classificationFallback = formatGroundwaterFallback(
  { action: "getClassificationSummary", arguments: { year: 2024 } },
  {
    year: 2024,
    totalCount: 5,
    classificationCounts: {
      safe: 3,
      semi_critical: 1,
      critical: 0,
      over_exploited: 1,
      salinity: 0,
    },
  },
);
assert.match(classificationFallback, /Safe: 3/);
assert.match(classificationFallback, /Over Exploited: 1/);
const assessmentFallback = formatGroundwaterFallback(
  { action: "getAssessment", arguments: { district: "Demo", assessmentUnit: "Unit", year: 2024 } },
  {
    district: "Demo",
    assessment_unit: "Unit",
    year: 2024,
    recharge: 12.5,
    annual_extractable_groundwater_resource: 10,
    extraction: 4,
    stage_of_groundwater_extraction_percent: null,
    net_groundwater_availability_for_future_use: 6,
    classification: "safe",
  },
);
assert.match(assessmentFallback, /Stage of groundwater extraction: Not available/);
assert.doesNotMatch(fallbackSource, /Pune|Indapur|18329\.5/);
report("successful query results have deterministic grounded fallback formatting with null safety");

assert.match(toolSource, /from "\.\.\/groundwater-queries\.server\.ts"/);
assert.doesNotMatch(toolSource, /APPROVED_GROUNDWATER_TOOLS|OllamaToolDefinition|\btools\s*:/i);
assert.match(toolSource, /switch \(toolName as ApprovedGroundwaterToolName\)/);
assert.match(intentPromptSource, /return ONLY one JSON object/);
assert.match(intentPromptSource, /unsupported/);
assert.match(intentSource, /validateToolArguments/);
report("only the existing query layer is reachable through the fixed executor");

assert.match(providerSource, /gemma3:4b/);
assert.match(envExampleSource, /OLLAMA_MODEL=/);
assert.match(docsSource, /OLLAMA_MODEL=gemma3:4b/);
assert.doesNotMatch(engineSource, /APPROVED_GROUNDWATER_TOOLS|tool_calls|\btools\s*:/i);
assert.doesNotMatch(engineSource, /eval\s*\(|new Function\s*\(|\bselect\s+\*/i);
assert.match(engineSource, /GROUNDWATER_INTENT_JSON_SCHEMA/);
assert.match(engineSource, /toolResult\.result\.error !== null/);
assert.match(engineSource, /formatGroundwaterFallback/);
assert.match(engineSource, /grounded: true/);
assert.match(engineSource, /grounded: true/);
assert.equal(LOCAL_AI_ENGINE_LIMITS.maxModelCalls, 2);
assert.equal(LOCAL_AI_ENGINE_LIMITS.maxToolExecutions, 1);
report("Gemma structured-intent flow replaces native Ollama tool calling");

assert.match(promptSource, /2024/);
assert.match(promptSource, /ha-m/);
assert.match(promptSource, /10,000 m/);
assert.match(promptSource, /10 million litres/);
assert.match(providerSource, /OLLAMA_MODEL/);
assert.match(providerSource, /OLLAMA_BASE_URL/);
assert.match(providerSource, /OLLAMA_TIMEOUT_MS/);
assert.match(providerSource, /import "server-only"/);
assert.match(engineSource, /provider.generateIntent/);
assert.match(engineSource, /provider.generateAnswer/);
assert.doesNotMatch(engineSource, /fetch\(/);
assert.match(engineSource, /INVALID_AI_INTENT|UNSUPPORTED_YEAR|GROUNDWATER_QUERY_ERROR|ANSWER_GENERATION_FAILED/);
report("2024 scope, ha-m rules, configurable Gemma settings, and safe error classes exist");

assert.match(routeSource, /getCurrentUser/);
assert.match(routeSource, /status: 401/);
assert.match(routeSource, /answerGroundwaterQuestion/);
assert.doesNotMatch(routeSource, /NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE_KEY|localhost:11434|OLLAMA_MODEL/);
assert.doesNotMatch(packageSource, /gemini|@google/i);
assert.doesNotMatch(envExampleSource, /GEMINI/i);
assert.doesNotMatch(read("app/app/chat/chat-client.tsx"), /localhost:11434|OLLAMA_|SUPABASE_SERVICE_ROLE_KEY|GEMINI/i);
report("authentication and server-only credential/model boundaries remain enforced");

const smokeBaseUrl = (process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/$/, "");
const smokeController = new AbortController();
const smokeTimeout = setTimeout(() => smokeController.abort(), 2_500);
let ollamaAvailable = false;
let gemmaAvailable = false;

try {
  const response = await fetch(`${smokeBaseUrl}/api/tags`, {
    signal: smokeController.signal,
  });
  if (response.ok) {
    ollamaAvailable = true;
    const payload = await response.json();
    gemmaAvailable = Array.isArray(payload.models) && payload.models.some((model) => model?.name === "gemma3:4b");
  }
} catch {
  ollamaAvailable = false;
} finally {
  clearTimeout(smokeTimeout);
}

if (!ollamaAvailable) {
  report("live Gemma smoke test skipped: Ollama is not reachable");
} else if (!gemmaAvailable) {
  report("live Gemma smoke test skipped: gemma3:4b is not installed");
} else {
  const liveCases = [
    {
      label: "classification distribution",
      question: "What is the groundwater classification distribution in Maharashtra?",
      expectedAction: "getClassificationSummary",
      expectedGrounded: true,
    },
    {
      label: "Pune resources",
      question: "What are the groundwater resources in Pune?",
      expectedAction: "getDistrictSummary",
      expectedGrounded: true,
    },
    {
      label: "Indapur assessment",
      question: "Tell me about Indapur.",
      expectedAction: "getAssessment",
      expectedGrounded: true,
    },
    {
      label: "Pune highest extraction units",
      question: "Which assessment units in Pune have the highest extraction?",
      expectedAction: "getTopExtractionAreas",
      expectedGrounded: true,
    },
    {
      label: "ha-m explanation",
      question: "What does 18,329.5 ha-m mean?",
      expectedAction: null,
      expectedGrounded: null,
    },
    {
      label: "unsupported historical year",
      question: "What was the groundwater extraction in 2018?",
      expectedAction: null,
      expectedGrounded: false,
    },
  ];

  const liveFailures = [];
  process.env.AI_PROVIDER = "ollama"; // Never make paid calls in this validator.
  delete process.env.AI_INTENT_MODEL;
  delete process.env.AI_ANSWER_MODEL;
  process.env.OLLAMA_TIMEOUT_MS = "60000";
  for (const testCase of liveCases) {
    const result = await answerGroundwaterQuestion(testCase.question);
    const action = result.toolsUsed[0] ?? null;
    const actionMatches =
      testCase.expectedAction === null || action === testCase.expectedAction;
    const groundingMatches =
      testCase.expectedGrounded === null || result.grounded === testCase.expectedGrounded;
    const historicalSafety =
      testCase.label !== "unsupported historical year" ||
      (result.grounded === false && result.year !== 2018);

    if (!actionMatches || !groundingMatches || !historicalSafety) {
      liveFailures.push(`${testCase.label} (action=${action ?? "none"}, grounded=${result.grounded}, error=${result.error?.code ?? "none"})`);
    }

    report(`live ${testCase.label}: action=${action ?? "none"}, grounded=${result.grounded}, error=${result.error?.code ?? "none"}, timings=${JSON.stringify(result.metadata.timings)}`);
  }

  if (liveFailures.length > 0) {
    report(`live Gemma cases needing improvement: ${liveFailures.join("; ")}`);
    assert.fail(`Live grounding/action regressions: ${liveFailures.join("; ")}`);
  } else {
    report("all six live Gemma smoke cases passed their grounding/safety expectations");
  }
}

console.log("AI engine validation passed.");
