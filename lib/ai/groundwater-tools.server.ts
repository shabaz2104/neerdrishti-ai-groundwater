import {
  getAssessment,
  getAssessmentUnits,
  getClassificationSummary,
  getDistrictComparison,
  getDistrictSummary,
  getDistricts,
  getOverallSummary,
  getTopExtractionAreas,
  type QueryResult,
} from "../groundwater-queries.server.ts";
import {
  validateToolArguments,
  type ApprovedGroundwaterToolName,
} from "./tool-arguments.ts";

export { APPROVED_GROUNDWATER_TOOL_NAMES } from "./tool-arguments.ts";
export type { ApprovedGroundwaterToolName } from "./tool-arguments.ts";

export type GroundwaterToolExecution =
  | {
      ok: true;
      toolName: ApprovedGroundwaterToolName;
      result: QueryResult<unknown>;
    }
  | {
      ok: false;
      toolName: string;
      error: string;
    };

/** Execute exactly one validated existing groundwater query. */
export async function executeGroundwaterTool(
  toolName: unknown,
  rawArguments: unknown,
): Promise<GroundwaterToolExecution> {
  if (typeof toolName !== "string") {
    return { ok: false, toolName: "", error: "Tool name must be a string." };
  }

  const validation = validateToolArguments(toolName, rawArguments);
  if ("error" in validation) {
    return { ok: false, toolName, error: String(validation.error) };
  }

  const args = validation;
  let result: QueryResult<unknown>;

  switch (toolName as ApprovedGroundwaterToolName) {
    case "getDistricts":
      result = await getDistricts();
      break;
    case "getAssessmentUnits":
      result = await getAssessmentUnits(args.district as string | undefined);
      break;
    case "getAssessment":
      result = await getAssessment(
        args.district as string,
        args.assessmentUnit as string,
        args.year as number | undefined,
      );
      break;
    case "getDistrictSummary":
      result = await getDistrictSummary(
        args.district as string,
        args.year as number | undefined,
      );
      break;
    case "getClassificationSummary":
      result = await getClassificationSummary(args.year as number | undefined);
      break;
    case "getTopExtractionAreas":
      result = await getTopExtractionAreas(
        args.year as number | undefined,
        args.limit as number | undefined,
        args.district as string | undefined,
      );
      break;
    case "getOverallSummary":
      result = await getOverallSummary(args.year as number | undefined);
      break;
    case "getDistrictComparison":
      result = await getDistrictComparison(args.year as number | undefined);
      break;
    default:
      return { ok: false, toolName, error: "The requested tool is not approved." };
  }

  return { ok: true, toolName: toolName as ApprovedGroundwaterToolName, result };
}
