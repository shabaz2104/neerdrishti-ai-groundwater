"use client";

import { useActionState } from "react";

import { ADMIN_CLASSIFICATIONS, type AdminGroundwaterDetail } from "@/lib/admin-groundwater";
import { initialUpdateRecordState, updateGroundwaterRecord } from "../actions";

const classificationLabels: Record<string, string> = { critical: "Critical", over_exploited: "Over Exploited", safe: "Safe", salinity: "Salinity", semi_critical: "Semi Critical" };

const metricFields: { key: keyof AdminGroundwaterDetail; label: string; help?: string; nullable?: boolean; unit: string }[] = [
  { key: "recharge", label: "Total annual recharge", unit: "ha-m" },
  { key: "annual_extractable_groundwater_resource", label: "Annual extractable resource", unit: "ha-m" },
  { key: "extraction", label: "Total extraction", unit: "ha-m" },
  { key: "net_groundwater_availability_for_future_use", label: "Net availability for future use", unit: "ha-m" },
  { key: "stage_of_groundwater_extraction_percent", label: "Stage of extraction", nullable: true, unit: "%", help: "May be left blank when the source value is unavailable." },
];

const componentFields: { key: keyof AdminGroundwaterDetail; label: string; unit: string }[] = [
  { key: "total_geographical_area", label: "Total geographical area", unit: "source unit" },
  { key: "recharge_worthy_area", label: "Recharge-worthy area", unit: "source unit" },
  { key: "recharge_from_rainfall_monsoon", label: "Rainfall recharge — monsoon", unit: "source unit" },
  { key: "recharge_from_other_sources_monsoon", label: "Other-source recharge — monsoon", unit: "source unit" },
  { key: "recharge_from_rainfall_non_monsoon", label: "Rainfall recharge — non-monsoon", unit: "source unit" },
  { key: "recharge_from_other_sources_non_monsoon", label: "Other-source recharge — non-monsoon", unit: "source unit" },
  { key: "total_natural_discharges", label: "Total natural discharges", unit: "ha-m" },
  { key: "irrigation_use", label: "Irrigation use", unit: "ha-m" },
  { key: "industrial_use", label: "Industrial use", unit: "ha-m" },
  { key: "domestic_use", label: "Domestic use", unit: "ha-m" },
  { key: "annual_gw_allocation_for_domestic_use_as_on_2025", label: "Domestic allocation as on 2025", unit: "ha-m" },
];

function NumericField({ field, record }: { field: { key: keyof AdminGroundwaterDetail; label: string; help?: string; nullable?: boolean; unit: string }; record: AdminGroundwaterDetail }) {
  const value = record[field.key];
  return <label className="admin-edit-field"><span>{field.label}<small>{field.unit}</small></span><input defaultValue={value === null ? "" : String(value)} min="0" name={field.key} required={!field.nullable} step="any" type="number" />{field.help && <em>{field.help}</em>}</label>;
}

export default function AdminRecordForm({ record }: { record: AdminGroundwaterDetail }) {
  const [state, formAction, pending] = useActionState(updateGroundwaterRecord, initialUpdateRecordState);
  return <form action={formAction} className="admin-edit-form">
    <input name="id" type="hidden" value={record.id} />
    <input name="expected_updated_at" type="hidden" value={record.updated_at} />
    {state.status !== "idle" && <p className={`admin-message ${state.status === "success" ? "is-success" : "is-error"}`} role={state.status === "success" ? "status" : "alert"}>{state.message}</p>}
    <section className="admin-form-section"><div className="admin-form-section-heading"><div><span>01</span><h2>Record identity</h2></div><p>District, unit and year form the unique logical key.</p></div><div className="admin-form-grid is-identity"><label className="admin-edit-field"><span>District</span><input defaultValue={record.district} maxLength={120} name="district" required /></label><label className="admin-edit-field"><span>Assessment unit</span><input defaultValue={record.assessment_unit} maxLength={160} name="assessment_unit" required /></label><label className="admin-edit-field"><span>Assessment year</span><input defaultValue={record.year} max={2024} min={2024} name="year" required step="1" type="number" /></label><label className="admin-edit-field"><span>Classification</span><select defaultValue={record.classification} name="classification" required>{ADMIN_CLASSIFICATIONS.map((classification) => <option key={classification} value={classification}>{classificationLabels[classification]}</option>)}</select></label></div></section>
    <section className="admin-form-section"><div className="admin-form-section-heading"><div><span>02</span><h2>Core groundwater measures</h2></div><p>Volumes use hectare-metres. A blank stage remains null.</p></div><div className="admin-form-grid">{metricFields.map((field) => <NumericField field={field} key={field.key} record={record} />)}</div></section>
    <section className="admin-form-section"><div className="admin-form-section-heading"><div><span>03</span><h2>Assessment components</h2></div><p>Fields marked “source unit” retain the original dataset’s unresolved unit semantics.</p></div><div className="admin-form-grid">{componentFields.map((field) => <NumericField field={field} key={field.key} record={record} />)}</div></section>
    <section className="admin-provenance"><div className="admin-form-section-heading"><div><span>04</span><h2>Source and audit details</h2></div><p>Read-only. Administrative edits do not overwrite this provenance.</p></div><dl><div><dt>Source document</dt><dd>{record.source_document}</dd></div><div><dt>Source reference</dt><dd>{record.source_reference}</dd></div><div><dt>Source codes</dt><dd>{record.state_code} · {record.district_code} · {record.assessment_unit_code}</dd></div><div><dt>Source serial / year</dt><dd>{record.source_serial_number} · {record.source_year}</dd></div><div><dt>Last database update</dt><dd>{new Date(record.updated_at).toLocaleString("en-IN")}</dd></div><div><dt>Administrator audit</dt><dd>Maintained in protected database metadata</dd></div></dl></section>
    <div className="admin-form-actions"><div><strong>Ready to save?</strong><span>The server will recheck authorization, validation and record freshness.</span></div><button className="admin-primary-button" disabled={pending} type="submit">{pending ? "Saving…" : "Save changes"}</button></div>
  </form>;
}
