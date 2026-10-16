import Link from "next/link";
import Form from "next/form";
import Image from "next/image";

import {
  getAssessmentUnits,
  getClassificationSummary,
  getDistrictComparison,
  getDistricts,
  getOverallSummary,
  type ClassificationSummary,
  type DistrictComparison,
  type GroundwaterClassification,
} from "@/lib/groundwater-queries.server";

import DashboardIcon from "./dashboard-icons";
import DashboardMap from "./dashboard-map";

export const dynamic = "force-dynamic";

const year = 2024;
const numberFormatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });
const classItems: { key: GroundwaterClassification; label: string; color: string }[] = [
  { key: "safe", label: "Safe", color: "var(--nd-class-safe)" },
  { key: "semi_critical", label: "Semi Critical", color: "var(--nd-class-semi-critical)" },
  { key: "critical", label: "Critical", color: "var(--nd-class-critical)" },
  { key: "over_exploited", label: "Over Exploited", color: "var(--nd-class-over-exploited)" },
  { key: "salinity", label: "Salinity", color: "var(--nd-class-salinity)" },
];

function Kpi({ label, value, detail, icon, tone }: { label: string; value: string; detail: string; icon: "drop" | "pump" | "records" | "districts" | "calendar"; tone: string }) {
  return <article className="dashboard-kpi dashboard-card"><span className={`dashboard-kpi-icon ${tone}`} aria-hidden="true"><DashboardIcon name={icon} className="h-7 w-7" /></span><div><p>{label}</p><strong>{value}</strong><small>{detail}</small></div></article>;
}

function ClassificationCard({ summary }: { summary: ClassificationSummary | null }) {
  let cursor = 0;
  const segments = summary && summary.totalCount > 0 ? classItems.map((item) => {
    const start = cursor;
    cursor += (summary.classificationCounts[item.key] / summary.totalCount) * 100;
    return `${item.color} ${start}% ${cursor}%`;
  }).join(", ") : "#e8edf0 0% 100%";

  return <section className="dashboard-card dashboard-classification" aria-labelledby="dashboard-classification-title">
    <div className="dashboard-title-cluster"><span className="section-icon section-icon-green"><DashboardIcon name="analytics" /></span><div><h2 id="dashboard-classification-title">Groundwater Classification</h2><p>Maharashtra · {year}</p></div></div>
    {summary && summary.totalCount > 0 ? <div className="dashboard-donut-layout">
      <div className="dashboard-donut" style={{ background: `conic-gradient(${segments})` }} role="img" aria-label={`Classification of ${summary.totalCount} assessment records in ${year}`}><div><strong>{summary.totalCount}</strong><span>assessment<br />records</span></div></div>
      <ul className="dashboard-class-list">{classItems.map((item) => { const count = summary.classificationCounts[item.key]; const percent = (count / summary.totalCount) * 100; return <li key={item.key}><span className="dashboard-class-name"><i style={{ backgroundColor: item.color }} aria-hidden="true" />{item.label}</span><strong>{count}</strong><span>({percent.toFixed(1)}%)</span></li>; })}</ul>
    </div> : <p className="dashboard-empty" role={summary ? "status" : "alert"}>{summary ? "No classification records are available." : "Classification data could not be loaded."}</p>}
  </section>;
}

const promptChips = [
  "What is the groundwater status in Pune?",
  "Which districts have the highest extraction?",
  "Explain the classification types",
  "Tell me about Indapur",
  "Compare groundwater status between districts",
];

function AssistantCard() {
  return <section className="dashboard-card dashboard-assistant" aria-labelledby="dashboard-ai-title">
    <div className="dashboard-title-cluster"><span className="section-icon section-icon-blue"><DashboardIcon name="chat" /></span><div><h2 id="dashboard-ai-title">AI Assistant <span className="dashboard-beta">Beta</span></h2><p>Ask questions about Maharashtra’s groundwater data</p></div></div>
    <div className="dashboard-prompts" aria-label="Suggested questions">{promptChips.map((prompt) => <Link key={prompt} prefetch={false} href={`/app/chat?prompt=${encodeURIComponent(prompt)}`}>{prompt}</Link>)}</div>
    <Form className="dashboard-ask-form" action="/app/chat"><label className="sr-only" htmlFor="dashboard-question">Ask a question about Maharashtra groundwater</label><input id="dashboard-question" name="prompt" maxLength={2000} required placeholder="Ask a question about Maharashtra’s groundwater..." /><button type="submit" aria-label="Open AI Assistant with this question"><DashboardIcon name="arrow" /></button></Form>
  </section>;
}

function TopDistrictsCard({ districts }: { districts: DistrictComparison[] | null }) {
  const top = districts ? [...districts].sort((a, b) => b.annualExtraction - a.annualExtraction || a.district.localeCompare(b.district)).slice(0, 5) : [];
  const maximum = Math.max(1, ...top.map((district) => district.annualExtraction));
  return <section className="dashboard-card dashboard-small-card" aria-labelledby="top-districts-title"><div className="dashboard-card-heading"><div className="dashboard-title-cluster"><span className="section-icon section-icon-blue"><DashboardIcon name="analytics" /></span><h2 id="top-districts-title">Top 5 Districts by Extraction ({year})</h2></div><Link className="dashboard-text-link" href="/app/analytics#district-comparison-title">View all districts →</Link></div>
    {districts && top.length ? <ol className="dashboard-top-list">{top.map((district, index) => <li key={district.district}><span className="dashboard-rank">{index + 1}</span><span className="dashboard-district-name">{district.district}</span><span className="dashboard-district-value">{numberFormatter.format(district.annualExtraction)} <small>ha-m</small></span><span className="dashboard-bar-track" aria-hidden="true"><span style={{ width: `${(district.annualExtraction / maximum) * 100}%` }} /></span></li>)}</ol> : <p className="dashboard-empty" role={districts ? "status" : "alert"}>{districts ? "No district extraction values are available." : "District comparisons could not be loaded."}</p>}
  </section>;
}

function ResourceCard({ resource, extraction }: { resource: number | null; extraction: number | null }) {
  const maximum = Math.max(resource ?? 0, extraction ?? 0, 1);
  return <section className="dashboard-card dashboard-small-card" aria-labelledby="resource-comparison-title"><div className="dashboard-title-cluster"><span className="section-icon section-icon-blue"><DashboardIcon name="drop" /></span><h2 id="resource-comparison-title">Groundwater Resource vs Extraction ({year})</h2></div><p className="dashboard-comparison-note">Annual extractable groundwater resource and annual extraction</p>
    <div className="dashboard-resource-bars"><div><div className="dashboard-resource-label"><span>Extractable resource</span><strong>{resource === null ? "Not available" : `${numberFormatter.format(resource)} ha-m`}</strong></div><span className="dashboard-resource-track"><span className="is-resource" style={{ width: `${((resource ?? 0) / maximum) * 100}%` }} /></span></div><div><div className="dashboard-resource-label"><span>Groundwater extraction</span><strong>{extraction === null ? "Not available" : `${numberFormatter.format(extraction)} ha-m`}</strong></div><span className="dashboard-resource-track"><span className="is-extraction" style={{ width: `${((extraction ?? 0) / maximum) * 100}%` }} /></span></div></div>
  </section>;
}

export default async function DashboardPage() {
  const [overall, classifications, districts, assessmentUnits, comparison] = await Promise.all([
    getOverallSummary(year), getClassificationSummary(year), getDistricts(), getAssessmentUnits(), getDistrictComparison(year),
  ]);
  const hasError = [overall, classifications, districts, assessmentUnits, comparison].some((result) => result.error !== null);
  const volumeResource = overall.data?.totalAnnualExtractableGroundwaterResource ?? null;
  const volumeExtraction = overall.data?.totalGroundwaterExtraction ?? null;
  const availableYear = classifications.data?.year ?? overall.data?.year ?? null;
  return <div className="dashboard-page">
    <section className="dashboard-hero" aria-labelledby="dashboard-title"><Image className="dashboard-hero-image" src="/images/maharashtra-water-landscape.webp" alt="" fill sizes="(max-width: 768px) 100vw, calc(100vw - 210px)" preload /><div className="dashboard-hero-copy"><p className="dashboard-eyebrow">NEERDRISHTI</p><h1 id="dashboard-title">Maharashtra’s<br />Groundwater Insights</h1><p className="dashboard-hero-subtitle">Data for people, planning and<br />a more water-secure future.</p></div></section>
    <div className="dashboard-content">
      {hasError && <p className="dashboard-data-warning" role="alert">Some dashboard data could not be loaded. Unavailable values are marked below; please refresh and try again.</p>}
      <section className="dashboard-kpis" aria-label="2024 groundwater summary">
        <Kpi icon="drop" tone="is-blue" label="Extractable Resource" value={volumeResource === null ? "—" : numberFormatter.format(volumeResource)} detail="ha-m · annual" />
        <Kpi icon="pump" tone="is-green" label="Total Extraction" value={volumeExtraction === null ? "—" : numberFormatter.format(volumeExtraction)} detail="ha-m · annual" />
        <Kpi icon="records" tone="is-blue" label="Assessment Units" value={assessmentUnits.data ? String(assessmentUnits.data.length) : "—"} detail="unique unit names" />
        <Kpi icon="districts" tone="is-amber" label="Districts" value={districts.data ? String(districts.data.length) : "—"} detail="in Maharashtra" />
        <Kpi icon="calendar" tone="is-violet" label="Assessment Year" value={availableYear === null ? "—" : String(availableYear)} detail="latest available data" />
      </section>
      <div className="dashboard-main-grid">
        <div className="dashboard-left-column"><DashboardMap districts={comparison.data ?? []} error={comparison.error !== null} /><div className="dashboard-bottom-grid"><TopDistrictsCard districts={comparison.data} /><ResourceCard resource={volumeResource} extraction={volumeExtraction} /></div></div>
        <div className="dashboard-right-column"><ClassificationCard summary={classifications.data} /><AssistantCard /></div>
      </div>
      <footer className="dashboard-footer"><section id="about"><h2>About NeerDrishti</h2><p>Explore Maharashtra’s verified 2024 groundwater assessments. Resource and extraction volumes are displayed in hectare-metres (ha-m).</p></section><section id="help"><h2>Need help?</h2><p>Use <Link href="/app/explorer">Explore Data</Link> for assessment units, <Link href="/app/analytics">Analytics</Link> for comparisons, or <Link href="/app/chat">AI Assistant</Link> for questions.</p></section></footer>
    </div>
  </div>;
}
