"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { useDistrictBoundaries } from "./analytics/use-district-boundaries";

import DashboardIcon from "./dashboard-icons";
import type { DistrictComparison, MapMetric } from "./analytics/map-types";

const LeafletMap = dynamic(() => import("./analytics/leaflet-map"), {
  ssr: false,
  loading: () => <div className="dashboard-map-loading" role="status">Loading interactive map…</div>,
});

const metrics: { key: MapMetric; label: string }[] = [
  { key: "annualExtraction", label: "Groundwater Extraction" },
  { key: "annualRecharge", label: "Annual Recharge" },
  { key: "annualExtractableResource", label: "Extractable Resource" },
  { key: "netAvailability", label: "Net Availability" },
];

const numberFormatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });
const sectionAnchors = ["about", "help"] as const;

export default function DashboardMap({ districts, error }: { districts: DistrictComparison[]; error: boolean }) {
  const [metric, setMetric] = useState<MapMetric>("annualExtraction");
  const [selectedName, setSelectedName] = useState<string | null>(
    districts.some((district) => district.district === "Pune") ? "Pune" : null,
  );
  const { frameRef, geoJson, boundaryError } = useDistrictBoundaries(error, sectionAnchors);

  const selected = districts.find((district) => district.district === selectedName);
  const maximum = Math.max(0, ...districts.map((district) => district[metric]));
  const metricLabel = metrics.find((item) => item.key === metric)?.label ?? "Selected metric";

  return (
    <section className="dashboard-card dashboard-map-card" aria-labelledby="dashboard-map-title">
      <div className="dashboard-card-heading">
        <div className="dashboard-title-cluster"><span className="section-icon section-icon-green"><DashboardIcon name="map" /></span><div><h2 id="dashboard-map-title">Maharashtra Groundwater Map</h2><p>Explore groundwater status across districts</p></div></div>
        <label className="dashboard-map-select"><span className="sr-only">Map metric</span><select value={metric} onChange={(event) => setMetric(event.target.value as MapMetric)}>{metrics.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select><DashboardIcon name="chevron" className="h-4 w-4" /></label>
      </div>
      <div className="dashboard-map-stage" ref={frameRef}>
        {error ? <p className="dashboard-map-loading" role="alert">District data could not be loaded. Please refresh and try again.</p> : boundaryError ? <p className="dashboard-map-loading" role="alert">District boundaries could not be loaded.</p> : geoJson ? <LeafletMap compact districts={districts} geoJson={geoJson} metric={metric} onSelectDistrict={setSelectedName} selectedDistrict={selectedName} /> : <div className="dashboard-map-loading" role="status">Loading Maharashtra district boundaries…</div>}
        {selected && <div className="dashboard-map-detail" aria-live="polite"><strong>{selected.district}</strong><dl><div><dt>{metricLabel}</dt><dd>{numberFormatter.format(selected[metric])} ha-m</dd></div><div><dt>Extraction</dt><dd>{numberFormatter.format(selected.annualExtraction)} ha-m</dd></div><div><dt>Assessment units</dt><dd>{selected.assessmentUnitCount}</dd></div></dl><Link href={`/app/explorer?district=${encodeURIComponent(selected.district)}&year=2024`}>View details <DashboardIcon name="arrow" className="h-3.5 w-3.5" /></Link></div>}
      </div>
      <div className="dashboard-map-legend"><span>{metricLabel} (ha-m)</span><span className="dashboard-map-scale" aria-hidden="true" /><span>0 to {numberFormatter.format(maximum)} ha-m</span><span className="dashboard-no-data">Gray = no matched data</span></div>
    </section>
  );
}
