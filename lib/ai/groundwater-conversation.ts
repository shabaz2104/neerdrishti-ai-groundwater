import type { AssessmentLocation } from "../groundwater-queries.server.ts";
import type { GroundwaterIntent } from "./groundwater-intent.ts";
import { GROUNDWATER_CATEGORIES } from "./tool-arguments.ts";

export const MAX_CONTEXT_QUESTIONS = 4;
export type GroundwaterTopic = "summary" | "classification" | "extraction" | "recharge";
export type ConversationContext = { district: string; assessmentUnit?: string; year: 2024; topic: GroundwaterTopic };
export type ConversationResolution =
  | { kind: "intent"; intent: GroundwaterIntent; context: ConversationContext }
  | { kind: "planner"; context?: ConversationContext }
  | { kind: "clarification"; message: string }
  | { kind: "unsupported"; code: "UNSUPPORTED_YEAR" | "UNSUPPORTED_INTENT"; message: string };

export function normalizeGroundwaterQuestion(value: string) {
  return value.toLowerCase().replace(/[’‘]/g, "'").replace(/\bground\s+water\b/g, "groundwater")
    .replace(/\bcritcal\b/g, "critical").replace(/\bover[ -]*exploited\b/g, "over exploited")
    .replace(/\bsemi[ -]+critical\b/g, "semi critical").replace(/\s+/g, " ").trim();
}

export function unsupportedQuestion(question: string): Extract<ConversationResolution, { kind: "unsupported" }> | null {
  if ((question.match(/\b(?:19|20|21)\d{2}\b/g) ?? []).some((year) => year !== "2024")) {
    return { kind: "unsupported", code: "UNSUPPORTED_YEAR", message: "The current structured NeerDrishti dataset only supports assessment year 2024." };
  }
  if (/\b(predict|prediction|forecast|tomorrow|today|next year|run out|water table|rainfall|potable|drinking|drink)\b/.test(question)) {
    return { kind: "unsupported", code: "UNSUPPORTED_INTENT", message: "I can describe the stored 2024 groundwater assessments, but cannot provide live readings, forecasts or drinking-water safety advice." };
  }
  return null;
}

function escapePattern(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function namePattern(value: string) { return new RegExp(`(^|[^\\p{L}\\p{N}])(${escapePattern(normalizeGroundwaterQuestion(value))})(?=$|[^\\p{L}\\p{N}])`, "u"); }
function mentioned(question: string, names: string[]) {
  const matches = [...new Set(names)].filter((name) => namePattern(name).test(question));
  return matches.filter((name) => !matches.some((other) => other !== name && normalizeGroundwaterQuestion(other).includes(normalizeGroundwaterQuestion(name))));
}

function topicFor(question: string): GroundwaterTopic | undefined {
  if (/\b(classification|classifications|classified|category|categories|status|zone|safe|critical|exploited|salinity)\b/.test(question)) return "classification";
  if (/\bextraction\b/.test(question) && !/\brecharge\b/.test(question)) return "extraction";
  if (/\brecharge\b/.test(question) && !/\bextraction\b/.test(question)) return "recharge";
  return undefined;
}

function proposedCategory(question: string) {
  let remainder = question;
  const proposed: string[] = [];
  for (const category of ["over_exploited", "semi_critical", "critical", "salinity", "safe"]) {
    const phrase = category.replaceAll("_", " ");
    const pattern = new RegExp(`\\b${phrase}\\b`, "g");
    if (pattern.test(remainder)) { proposed.push(category); remainder = remainder.replace(pattern, " "); }
  }
  return proposed.length === 1 ? proposed[0] : undefined;
}

// Small closed vocabulary for obvious local questions; all other phrasing goes to Gemma.
const SIMPLE_WORDS = new Set(("is are what which how does do tell me whether the a an of in at for as its it that this district area assessment unit groundwater classification classifications classified category categories fall under zone safe critical semi over exploited salinity status 2024 and or about please recharge extraction annual total s").split(" "));

function resolveOne(question: string, locations: AssessmentLocation[], previous?: ConversationContext): ConversationResolution {
  const q = normalizeGroundwaterQuestion(question);
  const unsupported = unsupportedQuestion(q);
  if (unsupported) return unsupported;
  const districts = mentioned(q, locations.map((row) => row.district));
  let units = mentioned(q, locations.map((row) => row.assessmentUnit));
  if (districts.length > 1) return { kind: "planner" };
  const explicitUnit = /\b(?:assessment unit|unit)\b/.test(q);
  if (!explicitUnit) units = units.filter((unit) => !districts.some((district) => normalizeGroundwaterQuestion(district).includes(normalizeGroundwaterQuestion(unit))));
  if (units.length > 1) return { kind: "planner" };
  const names = [...districts, ...units];
  let remaining = q;
  for (const name of names.sort((a, b) => b.length - a.length)) remaining = remaining.replace(namePattern(name), "$1 ");
  const words = remaining.replace(/['?.!,:-]/g, " ").split(/\s+/).filter(Boolean);
  const simple = words.length <= 30 && words.every((word) => SIMPLE_WORDS.has(word));
  const followup = /\b(it|its|that district|that area)\b/.test(q) || /^(and|what about)\b/.test(q);
  let district = districts[0];
  let assessmentUnit: string | undefined;
  if (units[0]) {
    const candidates = locations.filter((row) => row.assessmentUnit === units[0] && (!district || row.district === district));
    const contextual = !district && previous ? candidates.filter((row) => row.district === previous.district) : [];
    const choices = contextual.length === 1 ? contextual : candidates;
    if (choices.length !== 1) return { kind: "clarification", message: `Please specify the district for ${units[0]}; the assessment-unit name may occur in more than one district.` };
    district = choices[0].district;
    assessmentUnit = choices[0].assessmentUnit;
  } else if (!district && followup && previous) {
    district = previous.district;
    assessmentUnit = previous.assessmentUnit;
  }
  if (!district) return followup || explicitUnit
    ? { kind: "clarification", message: "Which district or assessment unit do you mean? Please name the place for the 2024 assessment." }
    : { kind: "planner" };
  const topic = topicFor(q) ?? (followup ? previous?.topic : undefined) ?? "summary";
  const context: ConversationContext = { district, ...(assessmentUnit ? { assessmentUnit } : {}), year: 2024, topic };
  if (!simple || (explicitUnit && !assessmentUnit)) return { kind: "planner", context };
  const proposedClassification = topic === "classification" ? proposedCategory(q) : undefined;
  return { kind: "intent", context, intent: {
    action: assessmentUnit ? "getAssessment" : "getDistrictSummary",
    arguments: { district, ...(assessmentUnit ? { assessmentUnit } : {}), year: 2024, topic, ...(proposedClassification ? { proposedClassification } : {}) },
  } };
}

export function resolveGroundwaterConversation(question: string, history: readonly string[], locations: AssessmentLocation[]): ConversationResolution {
  let context: ConversationContext | undefined;
  for (const previousQuestion of history.slice(-MAX_CONTEXT_QUESTIONS)) {
    const resolved = resolveOne(previousQuestion, locations, context);
    context = resolved.kind === "intent" || resolved.kind === "planner" ? resolved.context : undefined;
  }
  return resolveOne(question, locations, context);
}

/** Canonicalize model-selected names against current data; never fuzzy-match places. */
export function validateIntentEntities(intent: GroundwaterIntent, locations: AssessmentLocation[], question: string, context?: ConversationContext): GroundwaterIntent | null {
  const q = normalizeGroundwaterQuestion(question);
  const referencesContext = /\b(it|its|that district|that area)\b/.test(q) || /^(and|what about)\b/.test(q);
  const args = { ...intent.arguments };
  if (args.district !== undefined) {
    const district = locations.find((row) => normalizeGroundwaterQuestion(row.district) === normalizeGroundwaterQuestion(String(args.district)))?.district;
    if (!district) return null;
    args.district = district;
    const namedUnit = intent.action === "getAssessment" && namePattern(String(args.assessmentUnit)).test(q);
    if (!namePattern(district).test(q) && !namedUnit && !(referencesContext && context?.district === district)) return null;
  }
  if (intent.action === "getAssessment") {
    const match = locations.find((row) => row.district === args.district && normalizeGroundwaterQuestion(row.assessmentUnit) === normalizeGroundwaterQuestion(String(args.assessmentUnit)));
    if (!match) return null;
    if (!namePattern(match.assessmentUnit).test(q) && !(referencesContext && context?.assessmentUnit === match.assessmentUnit && context.district === match.district)) return null;
    const candidates = locations.filter((row) => row.assessmentUnit === match.assessmentUnit);
    if (candidates.length > 1 && !namePattern(match.district).test(q) && context?.district !== match.district) return null;
    args.assessmentUnit = match.assessmentUnit;
  }
  if (args.proposedClassification !== undefined && !GROUNDWATER_CATEGORIES.includes(args.proposedClassification as (typeof GROUNDWATER_CATEGORIES)[number])) return null;
  if (intent.action === "getDistrictSummary" || intent.action === "getAssessment") {
    const topic = topicFor(q) ?? args.topic;
    if (topic) args.topic = topic;
    // The user's proposed category comes from their wording, never model memory.
    delete args.proposedClassification;
    const proposed = topic === "classification" ? proposedCategory(q) : undefined;
    if (proposed) args.proposedClassification = proposed;
  }
  return { ...intent, arguments: args };
}
