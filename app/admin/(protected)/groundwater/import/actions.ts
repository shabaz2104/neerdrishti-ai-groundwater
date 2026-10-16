"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";

import { AdminAuthorizationError, requireAdmin } from "@/lib/admin-auth.server";
import {
  CsvValidationError, parseGroundwaterCsv, validateCsvFile,
  type CsvActionResult, type CsvComparison, type CsvImportResult, type CsvReport,
} from "@/lib/admin-csv-import";

async function readUpload(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) throw new CsvValidationError("Choose a CSV file first.");
  validateCsvFile(file);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const parsed = parseGroundwaterCsv(bytes);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const fileName = file.name.replace(/[\\/\u0000-\u001f\u007f]/g, "_").slice(-160);
  return { ...parsed, sha256, fileName };
}

function safeError(error: unknown): CsvActionResult {
  if (error instanceof AdminAuthorizationError) return { error: error.status === "unauthenticated"
    ? "Sign in with an administrator account to continue." : "You are not authorized to import groundwater records." };
  if (error instanceof CsvValidationError) return { error: error.message };
  return { error: "The import service is unavailable. No import was confirmed. Validate the file again before retrying." };
}

function reportFor(upload: Awaited<ReturnType<typeof readUpload>>, rows: CsvComparison[]): CsvReport {
  return {
    fileName: upload.fileName, sha256: upload.sha256,
    totalRows: upload.totalRows, validRows: upload.rows.length, invalidRows: upload.invalidRows,
    newRows: rows.filter((row) => row.status === "NEW").length,
    unchangedRows: rows.filter((row) => row.status === "UNCHANGED").length,
    conflictRows: rows.filter((row) => row.status === "CONFLICT").length,
    rows, issues: upload.issues,
  };
}

export async function validateCsvImport(formData: FormData): Promise<CsvActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const upload = await readUpload(formData);
    let rows: CsvComparison[] = [];
    if (upload.rows.length) {
      const { data, error } = await supabase.rpc("preview_groundwater_csv", { p_rows: upload.rows });
      if (error || !Array.isArray(data) || data.length !== upload.rows.length) throw new Error("Preview unavailable");
      rows = data as CsvComparison[];
    }
    return { report: reportFor(upload, rows) };
  } catch (error) { return safeError(error); }
}

export async function confirmCsvImport(formData: FormData): Promise<CsvActionResult> {
  try {
    const { supabase } = await requireAdmin();
    if (formData.get("confirm") !== "yes") return { error: "Validate the CSV and explicitly confirm the import first." };
    const upload = await readUpload(formData);
    if (formData.get("preview_sha256") !== upload.sha256) return { error: "The selected file changed. Validate it again before importing." };
    if (upload.invalidRows) return { error: "Resolve all invalid rows and validate the file again before importing." };
    const { data, error } = await supabase.rpc("import_groundwater_csv", {
      p_rows: upload.rows, p_file_name: upload.fileName, p_file_sha256: upload.sha256,
    });
    if (error || !data || typeof data.importId !== "string") throw new Error("Import unavailable");
    const result = data as CsvImportResult;
    for (const path of ["/admin", "/admin/groundwater", "/app", "/app/explorer", "/app/analytics", "/"]) revalidatePath(path);
    return { result };
  } catch (error) { return safeError(error); }
}
