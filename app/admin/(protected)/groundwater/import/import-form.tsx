"use client";

import { useRef, useState } from "react";
import type { CsvActionResult } from "@/lib/admin-csv-import";
import { confirmCsvImport, validateCsvImport } from "./actions";

export default function CsvImportForm({ templateHref }: { templateHref: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<CsvActionResult>({});
  const [pending, setPending] = useState<"validate" | "import" | null>(null);
  const submitLock = useRef(false);

  async function run(phase: "validate" | "import") {
    if (!file || pending || submitLock.current) return;
    submitLock.current = true;
    setPending(phase);
    const data = new FormData();
    data.set("file", file);
    if (phase === "import") {
      data.set("confirm", "yes");
      data.set("preview_sha256", state.report?.sha256 ?? "");
    }
    try {
      const response = await (phase === "validate" ? validateCsvImport(data) : confirmCsvImport(data));
      // Drop the old confirmation on any failed or completed request.
      setState(response);
    } catch { setState({ error: "The request could not be completed. Validate again to check the latest database state." }); }
    finally { submitLock.current = false; setPending(null); }
  }

  const report = state.report;
  const result = state.result;
  const details = report ? [
    ...report.issues.map((issue) => ({ ...issue, status: "INVALID" })),
    ...report.rows.map((row) => ({ ...row, reason: row.status === "CONFLICT" ? "Existing record differs. Use the record editor to review corrections." : row.status === "UNCHANGED" ? "Equivalent values already exist; this row will be skipped." : "No existing logical key; this row can be inserted." })),
  ].sort((a, b) => a.rowNumber - b.rowNumber) : result?.rows.map((row) => ({ ...row, reason: row.status === "CONFLICT" ? "Skipped: existing values differ." : row.status === "UNCHANGED" ? "Skipped: equivalent values already exist." : "Inserted." })) ?? [];

  return <div className="admin-import">
    <section className="admin-form-section"><div className="admin-form-section-heading"><div><span>01</span><h2>Select and validate</h2></div><a className="admin-row-action" download="groundwater-import-template.csv" href={templateHref}>Download CSV template</a></div>
      <p className="admin-import-guidance">Use the 24 normalized columns in the template. UTF-8 CSV only, up to 512 KiB and 1,000 rows. Only Maharashtra (MH), year 2024, and the five approved classifications are accepted.</p>
      <p className="admin-import-guidance">All measurements are required except stage of extraction, which may be blank. Groundwater volumes use ha-m; stage uses percent. Uploaded records are labelled as administrator uploads with unverified source provenance.</p>
      <form className="admin-upload-controls" onSubmit={(event) => { event.preventDefault(); void run("validate"); }}><label htmlFor="groundwater-csv">Groundwater CSV<input accept=".csv,text/csv" disabled={!!pending} id="groundwater-csv" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setState({}); }} required type="file" /></label><button className="admin-primary-button" disabled={!file || !!pending} type="submit">{pending === "validate" ? "Validating…" : "Validate file"}</button></form>
    </section>
    {state.error && <p className="admin-message is-error" role="alert">{state.error}</p>}
    {report && <section className="admin-form-section" aria-labelledby="csv-preview-title"><div className="admin-form-section-heading"><div><span>02</span><h2 id="csv-preview-title">Validation preview</h2></div><p>{report.fileName}</p></div><div className="admin-import-counts">{[["Total rows", report.totalRows], ["Valid rows", report.validRows], ["New", report.newRows], ["Unchanged", report.unchangedRows], ["Conflicts", report.conflictRows], ["Invalid", report.invalidRows]].map(([label, value]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
      <p className="admin-import-guidance" role="status">{report.invalidRows ? "Resolve all invalid rows and upload the corrected CSV before importing." : report.newRows ? "Only new records will be inserted. Unchanged rows and conflicts will be skipped. The database is checked again when you confirm." : "No new records to import. Existing conflicts can be reviewed in the record editor."}</p>
      {report.invalidRows === 0 && report.newRows > 0 && <button className="admin-primary-button" disabled={!!pending} onClick={() => void run("import")} type="button">{pending === "import" ? "Importing…" : `Import ${report.newRows} new records`}</button>}
    </section>}
    {result && <section className="admin-form-section" role="status"><h2>Import completed</h2><p className="admin-import-guidance">{result.insertedRows} inserted · {result.unchangedRows} unchanged · {result.conflictRows} conflicts skipped · {result.totalRows} total rows. The final counts reflect the database at confirmation time.</p><p className="admin-import-guidance">Import reference: {result.importId}</p></section>}
    {details.length > 0 && <section className="admin-table-card"><div className="admin-import-detail-heading"><h2>Row report</h2><p>CSV row numbers count the header as row 1. Quoted multiline fields count as one record.</p></div><div className="admin-table-scroll"><table className="admin-import-report"><thead><tr><th>CSV row</th><th>District / Assessment unit</th><th>Status</th><th>Reason</th></tr></thead><tbody>{details.map((row, index) => <tr key={`${row.rowNumber}-${index}`}><td>{row.rowNumber}</td><td><strong>{row.district || "Not available"}</strong><span>{row.assessmentUnit || "Not available"}</span></td><td>{row.status}</td><td>{row.reason}</td></tr>)}</tbody></table></div></section>}
  </div>;
}
