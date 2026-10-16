import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { requireAdmin } from "@/lib/admin-auth.server";
import { ADMIN_CLASSIFICATIONS, type AdminGroundwaterDetail, type AdminGroundwaterRecord } from "@/lib/admin-groundwater";
import type { GroundwaterClassification } from "@/lib/groundwater-queries.server";

export const ADMIN_PAGE_SIZE = 25;

export type AdminRecordFilters = {
  classification?: string;
  district?: string;
  page?: number;
  search?: string;
  year?: number;
};

export type AdminRecordPage = {
  page: number;
  pageCount: number;
  records: AdminGroundwaterRecord[];
  total: number;
};

const LIST_COLUMNS = [
  "id", "district", "assessment_unit", "year", "classification", "recharge",
  "annual_extractable_groundwater_resource", "extraction",
  "net_groundwater_availability_for_future_use",
  "stage_of_groundwater_extraction_percent", "updated_at",
].join(",");

const DETAIL_COLUMNS = [
  "id", "district", "assessment_unit", "year", "recharge", "extraction",
  "classification", "state_code", "district_code", "assessment_unit_code",
  "source_serial_number", "total_geographical_area", "recharge_worthy_area",
  "recharge_from_rainfall_monsoon", "recharge_from_other_sources_monsoon",
  "recharge_from_rainfall_non_monsoon", "recharge_from_other_sources_non_monsoon",
  "total_natural_discharges", "annual_extractable_groundwater_resource",
  "irrigation_use", "industrial_use", "domestic_use",
  "annual_gw_allocation_for_domestic_use_as_on_2025",
  "net_groundwater_availability_for_future_use",
  "stage_of_groundwater_extraction_percent", "source_year", "source_document",
  "source_reference", "created_at", "updated_at",
].join(",");

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseListRecord(value: Record<string, unknown>): AdminGroundwaterRecord | null {
  const year = asNumber(value.year);
  const recharge = asNumber(value.recharge);
  const resource = asNumber(value.annual_extractable_groundwater_resource);
  const extraction = asNumber(value.extraction);
  const availability = asNumber(value.net_groundwater_availability_for_future_use);
  const stage = value.stage_of_groundwater_extraction_percent === null
    ? null : asNumber(value.stage_of_groundwater_extraction_percent);
  const classification = value.classification;
  if (
    typeof value.id !== "string" || typeof value.district !== "string" ||
    typeof value.assessment_unit !== "string" || typeof value.updated_at !== "string" ||
    year === null || recharge === null || resource === null || extraction === null ||
    availability === null || stage === undefined ||
    !ADMIN_CLASSIFICATIONS.includes(classification as GroundwaterClassification)
  ) return null;
  return {
    id: value.id,
    district: value.district,
    assessment_unit: value.assessment_unit,
    year,
    classification: classification as GroundwaterClassification,
    recharge,
    annual_extractable_groundwater_resource: resource,
    extraction,
    net_groundwater_availability_for_future_use: availability,
    stage_of_groundwater_extraction_percent: stage,
    updated_at: value.updated_at,
  };
}

function normalizeSearch(value?: string) {
  const trimmed = value?.trim() ?? "";
  if (trimmed.length > 80 || !/^[\p{L}\p{N} .'-]*$/u.test(trimmed)) return null;
  return trimmed;
}

function normalizeDistrict(value?: string) {
  const trimmed = value?.trim() ?? "";
  if (trimmed.length > 120 || /[\u0000-\u001f\u007f]/.test(trimmed)) return null;
  return trimmed;
}

export async function getAdminGroundwaterRecords(filters: AdminRecordFilters): Promise<AdminRecordPage> {
  const { supabase } = await requireAdmin();
  const requestedPage = Number.isSafeInteger(filters.page) ? filters.page as number : 1;
  const page = Math.min(1_000_000, Math.max(1, requestedPage));
  const district = normalizeDistrict(filters.district);
  const search = normalizeSearch(filters.search);
  const invalidFilter = district === null || search === null ||
    (filters.year !== undefined && filters.year !== 2024) ||
    (filters.classification !== undefined && filters.classification !== "" && !ADMIN_CLASSIFICATIONS.includes(filters.classification as GroundwaterClassification));
  if (invalidFilter) return { records: [], total: 0, page: 1, pageCount: 1 };

  let countQuery = supabase
    .from("groundwater_assessments")
    .select("id", { count: "exact", head: true });

  if (district) countQuery = countQuery.eq("district", district);
  if (filters.classification && ADMIN_CLASSIFICATIONS.includes(filters.classification as GroundwaterClassification)) {
    countQuery = countQuery.eq("classification", filters.classification);
  }
  if (filters.year === 2024) countQuery = countQuery.eq("year", filters.year);
  if (search) countQuery = countQuery.or(`district.ilike.%${search}%,assessment_unit.ilike.%${search}%`);

  const { error: countError, count } = await countQuery;
  if (countError || count === null) throw new Error("Groundwater records could not be loaded.");

  const pageCount = Math.max(1, Math.ceil(count / ADMIN_PAGE_SIZE));
  const safeDataPage = Math.min(page, pageCount);
  const start = (safeDataPage - 1) * ADMIN_PAGE_SIZE;
  let query = supabase
    .from("groundwater_assessments")
    .select(LIST_COLUMNS)
    .order("district", { ascending: true })
    .order("assessment_unit", { ascending: true });

  if (district) query = query.eq("district", district);
  if (filters.classification && ADMIN_CLASSIFICATIONS.includes(filters.classification as GroundwaterClassification)) {
    query = query.eq("classification", filters.classification);
  }
  if (filters.year === 2024) query = query.eq("year", filters.year);
  if (search) query = query.or(`district.ilike.%${search}%,assessment_unit.ilike.%${search}%`);

  const { data, error } = await query.range(start, start + ADMIN_PAGE_SIZE - 1);
  if (error || !data) throw new Error("Groundwater records could not be loaded.");
  const records = data
    .map((row) => parseListRecord(row as unknown as Record<string, unknown>))
    .filter((row): row is AdminGroundwaterRecord => row !== null);
  if (records.length !== data.length) throw new Error("Groundwater records could not be interpreted safely.");
  return { records, total: count, page, pageCount };
}

export async function getAdminGroundwaterRecord(id: string, client?: SupabaseClient): Promise<AdminGroundwaterDetail | null> {
  const supabase = client ?? (await requireAdmin()).supabase;
  const { data, error } = await supabase
    .from("groundwater_assessments")
    .select(DETAIL_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("The groundwater record could not be loaded.");
  return data as AdminGroundwaterDetail | null;
}
