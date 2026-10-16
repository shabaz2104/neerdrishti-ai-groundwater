import type {
  ClassificationSummary,
  DistrictComparison,
  DistrictSummary,
  GroundwaterAssessment,
  OverallSummary,
  TopExtractionArea,
} from "../groundwater-queries.server.ts";
import type { GroundwaterIntent } from "./groundwater-intent.ts";

const FALLBACK_NOTE =
  "Formatted directly from NeerDrishti's 2024 groundwater data without AI formatting.";

function value(value: number | string | null | undefined): string {
  return value === null || value === undefined ? "Not available" : String(value);
}

function percentage(valueToFormat: number | null | undefined): string {
  return valueToFormat === null || valueToFormat === undefined
    ? "Not available"
    : `${valueToFormat}%`;
}

function label(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Concise answers to focused questions are generated only from fresh query values. */
export function formatFocusedGroundwaterAnswer(intent: GroundwaterIntent, data: unknown): string | null {
  if (intent.action !== "getDistrictSummary" && intent.action !== "getAssessment") return null;
  const topic = intent.arguments.topic;
  if (!topic || topic === "summary") return null;
  const districtResult = intent.action === "getDistrictSummary" ? data as DistrictSummary : null;
  const unitResult = intent.action === "getAssessment" ? data as GroundwaterAssessment : null;
  const name = districtResult ? districtResult.district : `${unitResult!.assessment_unit} (${unitResult!.district})`;
  const year = districtResult?.year ?? unitResult?.year;
  if (districtResult && districtResult.recordCount === 0) return `No ${year} groundwater assessment records are available for ${name}.`;
  if (topic === "extraction" || topic === "recharge") {
    const measure = topic === "extraction" ? districtResult?.totalGroundwaterExtraction ?? unitResult?.extraction : districtResult?.totalAnnualRecharge ?? unitResult?.recharge;
    return `${name} — ${year}: ${topic === "extraction" ? "groundwater extraction" : "annual recharge"} is ${value(measure)} ha-m.`;
  }
  if (topic !== "classification") return null;
  const categories = districtResult
    ? Object.entries(districtResult.classificationCounts).filter(([, count]) => count > 0)
    : [[unitResult!.classification, 1]] as [string, number][];
  if (!categories.length) return `No classification records are available for ${name} in ${year}.`;
  if (categories.length > 1) return [
    `${name} does not have one single groundwater classification in the ${year} assessment. Its assessment records span:`,
    ...categories.map(([category, count]) => `- ${label(category)}: ${count} assessment records`),
  ].join("\n");
  const actual = categories[0][0];
  const expected = intent.arguments.proposedClassification;
  const prefix = expected ? expected === actual ? "Yes. " : "No. " : "";
  return `${prefix}${name}'s ${year} groundwater assessment is classified as ${label(actual)}.${expected && expected !== actual ? ` The classification is not ${label(String(expected))}.` : ""}`;
}

function formatClassificationSummary(result: ClassificationSummary): string {
  const counts = result.classificationCounts;
  return [
    `The ${value(result.year)} Maharashtra groundwater classification distribution is:`,
    `- Safe: ${value(counts.safe)}`,
    `- Semi Critical: ${value(counts.semi_critical)}`,
    `- Critical: ${value(counts.critical)}`,
    `- Over Exploited: ${value(counts.over_exploited)}`,
    `- Salinity: ${value(counts.salinity)}.`,
    FALLBACK_NOTE,
  ].join("\n");
}

function formatDistrictSummary(result: DistrictSummary | OverallSummary): string {
  const district = "district" in result ? result.district : "Maharashtra";
  const classifications = Object.entries(result.classificationCounts)
    .map(([classification, count]) => `${label(classification)}: ${value(count)}`)
    .join(", ");

  return [
    `${district} groundwater summary for ${value(result.year)}:`,
    `- Assessment units: ${value(result.assessmentUnitCount)}`,
    `- Annual recharge: ${value(result.totalAnnualRecharge)} ha-m`,
    `- Annual extractable groundwater resource: ${value(result.totalAnnualExtractableGroundwaterResource)} ha-m`,
    `- Groundwater extraction: ${value(result.totalGroundwaterExtraction)} ha-m`,
    `- Net groundwater availability: ${value(result.totalNetGroundwaterAvailability)} ha-m`,
    `- Classifications: ${classifications}.`,
    FALLBACK_NOTE,
  ].join("\n");
}

function formatAssessment(result: GroundwaterAssessment): string {
  return [
    `${result.assessment_unit} groundwater assessment in ${result.district} (${value(result.year)}):`,
    `- Annual recharge: ${value(result.recharge)} ha-m`,
    `- Annual extractable groundwater resource: ${value(result.annual_extractable_groundwater_resource)} ha-m`,
    `- Groundwater extraction: ${value(result.extraction)} ha-m`,
    `- Stage of groundwater extraction: ${percentage(result.stage_of_groundwater_extraction_percent)}`,
    `- Net groundwater availability for future use: ${value(result.net_groundwater_availability_for_future_use)} ha-m`,
    `- Classification: ${label(result.classification)}.`,
    FALLBACK_NOTE,
  ].join("\n");
}

function formatTopExtraction(result: TopExtractionArea[]): string {
  const rows = result.length
    ? result.map(
        (area, index) =>
          `${index + 1}. ${area.assessmentUnit} (${area.district}) — extraction: ${value(area.extraction)} ha-m; classification: ${label(area.classification)}.`,
      )
    : ["No matching assessment units were found."];

  return ["Assessment units ranked by groundwater extraction:", ...rows, FALLBACK_NOTE].join("\n");
}

function formatDistrictComparison(result: DistrictComparison[]): string {
  const rows = result.length
    ? result.map(
        (district) =>
          `- ${district.district}: extraction ${value(district.annualExtraction)} ha-m; net availability ${value(district.netAvailability)} ha-m.`,
      )
    : ["No district comparison data was found."];

  return ["District groundwater comparison:", ...rows, FALLBACK_NOTE].join("\n");
}

function formatList(result: string[], heading: string): string {
  const rows = result.length ? result.map((item) => `- ${item}`) : ["- No matching entries were found."];
  return [heading, ...rows, FALLBACK_NOTE].join("\n");
}

/** Format only successful structured query results; never creates groundwater values. */
export function formatGroundwaterFallback(
  intent: GroundwaterIntent,
  result: unknown,
): string | null {
  const focused = formatFocusedGroundwaterAnswer(intent, result);
  if (focused) return focused;
  switch (intent.action) {
    case "getClassificationSummary":
      return formatClassificationSummary(result as ClassificationSummary);
    case "getDistrictSummary":
      return formatDistrictSummary(result as DistrictSummary);
    case "getAssessment":
      return formatAssessment(result as GroundwaterAssessment);
    case "getTopExtractionAreas":
      return formatTopExtraction(result as TopExtractionArea[]);
    case "getOverallSummary":
      return formatDistrictSummary(result as OverallSummary);
    case "getDistrictComparison":
      return formatDistrictComparison(result as DistrictComparison[]);
    case "getDistricts":
      return formatList(result as string[], "Available districts:");
    case "getAssessmentUnits":
      return formatList(result as string[], "Available assessment units:");
    default:
      return null;
  }
}
