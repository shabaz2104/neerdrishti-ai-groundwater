"use server";

import { revalidatePath } from "next/cache";

import { AdminAuthorizationError, requireAdmin } from "@/lib/admin-auth.server";
import { ADMIN_CLASSIFICATIONS } from "@/lib/admin-groundwater";
import { getAdminGroundwaterRecord } from "@/lib/admin-groundwater.server";

export type UpdateRecordState = { status: "error" | "idle" | "success"; message?: string };
export const initialUpdateRecordState: UpdateRecordState = { status: "idle" };
const EDITABLE_YEAR = 2024;
const MAX_GROUNDWATER_VALUE = 1_000_000_000_000;

const REQUIRED_TEXT = ["district", "assessment_unit"] as const;
const REQUIRED_NUMBERS = [
  "recharge", "extraction", "total_geographical_area", "recharge_worthy_area",
  "recharge_from_rainfall_monsoon", "recharge_from_other_sources_monsoon",
  "recharge_from_rainfall_non_monsoon", "recharge_from_other_sources_non_monsoon",
  "total_natural_discharges", "annual_extractable_groundwater_resource",
  "irrigation_use", "industrial_use", "domestic_use",
  "annual_gw_allocation_for_domestic_use_as_on_2025",
  "net_groundwater_availability_for_future_use",
] as const;

function textField(formData: FormData, name: string, maxLength: number): string | null {
  const value = formData.get(name);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= maxLength && !/[\u0000-\u001f\u007f]/.test(trimmed) ? trimmed : null;
}

function numericField(formData: FormData, name: string, nullable = false): number | null | undefined {
  const value = formData.get(name);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (trimmed === "") return nullable ? null : undefined;
  if (trimmed.length > 64) return undefined;
  if (!/^-?(?:\d+\.?\d*|\.\d+)$/.test(trimmed)) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function updateGroundwaterRecord(
  _previousState: UpdateRecordState,
  formData: FormData,
): Promise<UpdateRecordState> {
  try {
    const { supabase } = await requireAdmin();
    const id = textField(formData, "id", 64);
    const expectedUpdatedAt = textField(formData, "expected_updated_at", 64);
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) || !expectedUpdatedAt) return { status: "error", message: "This edit request is incomplete. Refresh and try again." };

    const current = await getAdminGroundwaterRecord(id, supabase);
    if (!current) return { status: "error", message: "This groundwater record no longer exists." };
    if (current.updated_at !== expectedUpdatedAt) return { status: "error", message: "This record changed after you opened it. Refresh before saving your edits." };

    const district = textField(formData, REQUIRED_TEXT[0], 120);
    const assessmentUnit = textField(formData, REQUIRED_TEXT[1], 160);
    const year = numericField(formData, "year");
    const classification = textField(formData, "classification", 40);
    if (!district || !assessmentUnit || year !== EDITABLE_YEAR || !classification || !ADMIN_CLASSIFICATIONS.includes(classification as (typeof ADMIN_CLASSIFICATIONS)[number])) {
      return { status: "error", message: "Check the district, assessment unit, 2024 assessment year and classification values." };
    }

    const update: Record<string, string | number | null> = {
      district, assessment_unit: assessmentUnit, year, classification,
    };
    for (const field of REQUIRED_NUMBERS) {
      const parsed = numericField(formData, field);
      if (parsed === undefined || parsed === null || parsed < 0 || parsed > MAX_GROUNDWATER_VALUE) return { status: "error", message: "All required groundwater measurements must contain valid non-negative numbers within the supported range." };
      update[field] = parsed;
    }
    const stage = numericField(formData, "stage_of_groundwater_extraction_percent", true);
    if (stage === undefined || (stage !== null && (stage < 0 || stage > MAX_GROUNDWATER_VALUE))) return { status: "error", message: "Stage of extraction must be a non-negative number within the supported range or left blank." };
    update.stage_of_groundwater_extraction_percent = stage;

    const { data: duplicate, error: duplicateError } = await supabase
      .from("groundwater_assessments")
      .select("id")
      .eq("district", district)
      .eq("assessment_unit", assessmentUnit)
      .eq("year", year)
      .neq("id", id)
      .maybeSingle();
    if (duplicateError) return { status: "error", message: "The logical record key could not be validated. No changes were saved." };
    if (duplicate) return { status: "error", message: "A record already exists for that district, assessment unit and year." };

    const { data, error } = await supabase
      .from("groundwater_assessments")
      .update(update)
      .eq("id", id)
      .eq("updated_at", expectedUpdatedAt)
      .select("id")
      .maybeSingle();
    if (error?.code === "23505") return { status: "error", message: "A record already exists for that district, assessment unit and year." };
    if (error) return { status: "error", message: "The groundwater record could not be updated. No changes were confirmed." };
    if (!data) return { status: "error", message: "This record changed before the update completed. Refresh and review the latest values." };

    revalidatePath("/admin");
    revalidatePath("/admin/groundwater");
    revalidatePath(`/admin/groundwater/${id}`);
    revalidatePath("/app");
    return { status: "success", message: "Groundwater record updated." };
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return { status: "error", message: error.status === "unauthenticated" ? "Your admin session has expired. Sign in again." : "You are not authorized to update groundwater records." };
    }
    return { status: "error", message: "The groundwater record could not be updated. Please try again." };
  }
}
