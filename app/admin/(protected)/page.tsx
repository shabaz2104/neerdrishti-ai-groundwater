import Link from "next/link";
import { redirect } from "next/navigation";

import DashboardIcon from "@/app/app/dashboard-icons";
import { AdminAuthorizationError, requireAdmin } from "@/lib/admin-auth.server";
import { getAssessmentUnits, getDistricts, getOverallSummary } from "@/lib/groundwater-queries.server";

const year = 2024;

export default async function AdminOverviewPage() {
  try { await requireAdmin(); }
  catch (error) {
    if (error instanceof AdminAuthorizationError) redirect(error.status === "unauthenticated" ? "/admin/login" : "/admin/login?error=unauthorized");
    throw error;
  }
  const [overall, districts, units] = await Promise.all([getOverallSummary(year), getDistricts(), getAssessmentUnits()]);
  const cards = [
    { icon: "records", label: "Assessment records", value: overall.data?.recordCount },
    { icon: "districts", label: "Districts", value: districts.data?.length },
    { icon: "explore", label: "Unique unit names", value: units.data?.length },
    { icon: "calendar", label: "Assessment year", value: year },
  ] as const;
  const hasError = [overall, districts, units].some((result) => result.error !== null);
  return <div className="admin-page"><div className="admin-page-heading"><div><p>Operational overview</p><h1>Administration</h1><span>Review the current groundwater dataset and manage controlled corrections.</span></div><Link className="admin-primary-button" href="/admin/groundwater">Manage groundwater records <DashboardIcon name="arrow" /></Link></div>
    {hasError && <p className="admin-message is-error" role="alert">Some database totals could not be loaded. No values have been estimated.</p>}
    <section className="admin-kpi-grid" aria-label="Database summary">{cards.map((card) => <article key={card.label}><span><DashboardIcon name={card.icon} /></span><div><p>{card.label}</p><strong>{card.value ?? "—"}</strong></div></article>)}</section>
    <section className="admin-operation-card"><div><span className="admin-section-icon"><DashboardIcon name="records" /></span><div><h2>Groundwater records</h2><p>Search, inspect and correct existing assessment records. Source identifiers and provenance remain read-only.</p></div></div><Link href="/admin/groundwater">Open record manager <DashboardIcon name="arrow" /></Link></section>
    <section className="admin-governance"><h2>Change boundary</h2><div><article><strong>Database corrections</strong><p>Approved groundwater fields can be updated by authorized administrators.</p></article><article><strong>Source evidence</strong><p>Raw files, the normalized CSV and documented report provenance are never rewritten here.</p></article><article><strong>Audit metadata</strong><p>The database records the latest update time and authenticated administrator.</p></article></div></section>
  </div>;
}
