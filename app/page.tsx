import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import DashboardIcon from "@/app/app/dashboard-icons";
import PublicBrand from "@/app/public-brand";
import ThemeToggle from "@/app/theme-toggle";
import { getDistricts, getOverallSummary } from "@/lib/groundwater-queries.server";

export const dynamic = "force-dynamic";

const capabilities = [
  { icon: "explore", label: "Explore", title: "Find the local picture", description: "Browse district and assessment-unit groundwater records." },
  { icon: "map", label: "Map", title: "See the wider pattern", description: "View groundwater classifications across Maharashtra on a map." },
  { icon: "analytics", label: "Analyze", title: "Make comparisons", description: "Compare recharge, extraction, resource and availability data." },
  { icon: "chat", label: "Ask", title: "Start with a question", description: "Ask the AI Assistant questions grounded in stored groundwater data." },
] as const;

const audiences = [
  { number: "01", title: "Farmers & communities", description: "Get a clearer view of the published groundwater assessment for your area." },
  { number: "02", title: "Researchers & students", description: "Explore the records and compare places using a consistent 2024 dataset." },
  { number: "03", title: "Planners & decision-makers", description: "See district patterns and source figures in one accessible workspace." },
] as const;

function PublicHeader() {
  return <header className="public-header"><div className="public-container public-header-inner">
    <PublicBrand />
    <nav className="public-header-actions" aria-label="Public navigation"><ThemeToggle /><Link className="public-link" href="/auth">Sign in</Link><Link className="public-button public-button-small" href="/auth?mode=signup">Get started <DashboardIcon name="arrow" /></Link></nav>
  </div></header>;
}

function PublicFooter() {
  return <footer className="public-footer"><div className="public-container public-footer-inner">
    <PublicBrand />
    <nav aria-label="Footer navigation"><a href="#about">About</a><a href="#data">Data & source</a><Link href="/auth">Sign in</Link></nav>
    <small>2024 Maharashtra groundwater assessment data</small>
  </div></footer>;
}

async function CoverageStats() {
  const [overall, districts] = await Promise.all([getOverallSummary(2024), getDistricts()]);
  const coverage = [
    { value: districts.data?.length, label: "Districts", detail: "across Maharashtra" },
    { value: overall.data?.assessmentUnitCount, label: "Unique unit names", detail: "assessment units" },
    { value: overall.data?.recordCount, label: "Assessment records", detail: "in the dataset" },
    { value: 2024, label: "Assessment year", detail: "current dataset" },
  ];

  return <Coverage coverage={coverage} error={Boolean(overall.error || districts.error)} />;
}

function Coverage({ coverage, error = false, pending = false }: { coverage: { value?: number; label: string; detail: string }[]; error?: boolean; pending?: boolean }) {
  return <section className="public-coverage public-container" aria-label="2024 dataset coverage" aria-busy={pending}>
    {coverage.map((item) => <div className="public-coverage-item" key={item.label}><strong>{item.value ?? "—"}</strong><span>{item.label}</span><small>{item.detail}</small></div>)}
    {pending && <span className="sr-only" role="status">Loading dataset coverage</span>}
    {error && <p className="public-data-note" role="status">Some coverage figures are temporarily unavailable.</p>}
  </section>;
}

export default function Home() {

  return <div className="public-site">
    <PublicHeader />
    <main>
    <section className="public-hero" aria-labelledby="public-title">
      <Image className="public-hero-image" src="/images/maharashtra-water-landscape.webp" alt="" fill sizes="100vw" preload />
      <div className="public-hero-shade" aria-hidden="true" />
      <div className="public-container public-hero-inner"><div className="public-hero-copy">
        <p className="public-eyebrow">Maharashtra Groundwater Insights</p>
        <h1 id="public-title">Understand the water<br />beneath Maharashtra.</h1>
        <p className="public-hero-description">Explore 2024 groundwater assessments across Maharashtra through maps, data, analytics and a grounded AI assistant.</p>
        <div className="public-actions"><Link className="public-button" href="/auth?mode=signup">Explore NeerDrishti <DashboardIcon name="arrow" /></Link><a className="public-button public-button-outline" href="#data">Learn about the data</a></div>
      </div></div>
    </section>

    <Suspense fallback={<Coverage pending coverage={[
      { label: "Districts", detail: "across Maharashtra" },
      { label: "Unique unit names", detail: "assessment units" },
      { label: "Assessment records", detail: "in the dataset" },
      { label: "Assessment year", detail: "current dataset", value: 2024 },
    ]} />}><CoverageStats /></Suspense>

    <section className="public-section public-container" id="capabilities" aria-labelledby="capabilities-title">
      <div className="public-section-heading"><div><p className="public-eyebrow">A clearer view</p><h2 id="capabilities-title">What can you do?</h2></div><p>Explore the same groundwater records from different angles, at a pace that works for you.</p></div>
      <div className="public-capability-grid">{capabilities.map((item) => <article className="public-capability-card" key={item.label}><span className="public-card-icon" aria-hidden="true"><DashboardIcon name={item.icon} /></span><p className="public-card-label">{item.label}</p><h3>{item.title}</h3><p>{item.description}</p></article>)}</div>
    </section>

    <section className="public-data-section" id="data" aria-labelledby="data-title"><div className="public-container public-data-layout">
      <div><p className="public-eyebrow">The data behind the view</p><h2 id="data-title">Built around real groundwater assessments.</h2><p>NeerDrishti currently works with Maharashtra’s 2024 groundwater assessment data. Explore the source records by district and assessment unit, or compare their reported groundwater measures.</p><p>These are assessment records, not live water-level readings or forecasts.</p></div>
      <aside className="public-data-card"><span className="public-card-icon" aria-hidden="true"><DashboardIcon name="drop" /></span><h3>Reading the numbers</h3><p>Groundwater resource and extraction volumes are shown in hectare-metres (ha-m).</p><div className="public-data-equation"><strong>1 ha-m</strong><span>= 10,000 cubic metres<br />= 10 million litres</span></div><p className="public-source-note">Source: 2024 groundwater assessment data documented in this project.</p></aside>
    </div></section>

    <section className="public-section public-container" id="about" aria-labelledby="audience-title"><div className="public-section-heading"><div><p className="public-eyebrow">Made to be understood</p><h2 id="audience-title">Groundwater information for more people.</h2></div><p>Clearer access to the same published data can support learning, discussion and planning.</p></div><div className="public-audience-grid">{audiences.map((item) => <article key={item.number}><span>{item.number}</span><h3>{item.title}</h3><p>{item.description}</p></article>)}</div></section>

    <section className="public-assistant-section public-container" aria-labelledby="assistant-title"><div className="public-assistant-copy"><span className="public-card-icon" aria-hidden="true"><DashboardIcon name="chat" /></span><p className="public-eyebrow">AI Assistant</p><h2 id="assistant-title">Have a question about the data?</h2><p>Ask about groundwater records and comparisons. The assistant answers supported questions using NeerDrishti’s stored groundwater data.</p><Link className="public-text-action" href="/auth">Sign in to ask a question <DashboardIcon name="arrow" /></Link></div><div className="public-prompt-card" aria-label="Example questions"><span>Try asking</span><p>“What is the groundwater status in Pune?”</p><p>“Which districts have the highest extraction?”</p><p>“Tell me about Indapur.”</p></div></section>

    <section className="public-final-section"><div className="public-container public-final-inner"><div><p className="public-eyebrow">NeerDrishti</p><h2>Explore Maharashtra’s groundwater.</h2><p>Open the workspace to explore the 2024 assessments in more detail.</p></div><Link className="public-button public-button-light" href="/auth?mode=signup">Get started <DashboardIcon name="arrow" /></Link></div></section>
    </main>
    <PublicFooter />
  </div>;
}
