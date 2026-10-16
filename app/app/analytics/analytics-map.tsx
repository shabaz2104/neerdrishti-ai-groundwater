"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useDistrictBoundaries } from "./use-district-boundaries";

import type {
  DistrictComparison,
  MapMetric,
} from "./map-types";

const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-full min-h-[28rem] items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-600"
      role="status"
    >
      Loading interactive map…
    </div>
  ),
});

const METRICS: Array<{ key: MapMetric; label: string }> = [
  { key: "annualExtraction", label: "Extraction" },
  { key: "annualRecharge", label: "Recharge" },
  { key: "annualExtractableResource", label: "Extractable Resource" },
  { key: "netAvailability", label: "Net Availability" },
];

const numberFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
});
const sectionAnchors = ["district-map-title", "district-comparison-title"] as const;

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function getMetricValue(district: DistrictComparison, metric: MapMetric) {
  return district[metric];
}

function formatCubicMetres(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
    notation: "compact",
  }).format(value * 10_000);
}

function formatLitres(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
    notation: "compact",
  }).format(value * 10_000_000);
}

type AnalyticsMapProps = {
  districts: DistrictComparison[];
  year: number;
  aggregationError?: boolean;
};

export default function AnalyticsMap({
  districts,
  year,
  aggregationError = false,
}: AnalyticsMapProps) {
  const [metric, setMetric] = useState<MapMetric>("annualExtraction");
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const { frameRef, geoJson, boundaryError } = useDistrictBoundaries(aggregationError, sectionAnchors);

  const metricLabel =
    METRICS.find((item) => item.key === metric)?.label ?? "Selected metric";
  const selected = districts.find(
    (district) => district.district === selectedDistrict,
  );
  const topDistricts = useMemo(
    () =>
      [...districts]
        .sort((left, right) => {
          const difference =
            getMetricValue(right, metric) - getMetricValue(left, metric);
          return difference || left.district.localeCompare(right.district);
        })
        .slice(0, 10),
    [districts, metric],
  );
  const maximum = Math.max(
    ...topDistricts.map((district) => getMetricValue(district, metric)),
    1,
  );

  return (
    <>
      <section
        aria-labelledby="district-map-title"
        className="nd-card nd-analysis-card"
      >
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="nd-eyebrow">
              Spatial district comparison
            </p>
            <h2
              className="nd-section-title mt-2"
              id="district-map-title"
            >
              Where groundwater metrics are concentrated
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Select a metric to recolor the districts, then hover or click a
              district for its stored {year} aggregate.
            </p>
          </div>
          <div className="w-full lg:max-w-xs">
            <label
              className="text-sm font-semibold text-slate-700"
              htmlFor="map-metric"
            >
              Map metric
            </label>
            <select
              className="nd-control mt-2 w-full px-3 py-2.5 text-sm"
              id="map-metric"
              onChange={(event) => setMetric(event.target.value as MapMetric)}
              value={metric}
            >
              {METRICS.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {aggregationError ? (
          <div
            className="nd-alert-error mt-6 rounded-xl border p-5 text-sm leading-6"
            role="alert"
          >
            District groundwater aggregates could not be loaded. Please refresh
            and try again.
          </div>
        ) : (
          <div className="nd-map-layout mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(17rem,0.7fr)]">
            <div>
              <div className="nd-map-frame" ref={frameRef}>
                {boundaryError ? (
                  <div
                    className="flex min-h-[28rem] items-center justify-center p-6 text-center text-sm leading-6 text-rose-700"
                    role="alert"
                  >
                    Unable to load Maharashtra district boundaries. The
                    comparison data is still available below.
                  </div>
                ) : geoJson ? (
                  <LeafletMap
                    districts={districts}
                    geoJson={geoJson}
                    metric={metric}
                    onSelectDistrict={setSelectedDistrict}
                    selectedDistrict={selectedDistrict}
                  />
                ) : (
                  <div
                    className="flex min-h-[28rem] items-center justify-center text-sm text-slate-600"
                    role="status"
                  >
                    Loading Maharashtra district boundaries…
                  </div>
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  {metricLabel} (ha-m)
                </span>
                <span className="h-3 w-28 rounded-full bg-gradient-to-r from-sky-200 via-teal-500 to-emerald-800" />
                <span>Lower · 0 ha-m</span>
                <span>Higher · {formatNumber(Math.max(...districts.map((district) => getMetricValue(district, metric)), 0))} ha-m</span>
                <span className="text-slate-400">
                  Unmatched boundaries are shown in grey.
                </span>
              </div>
            </div>

            <aside
              aria-live="polite"
              className="nd-comparison-panel p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Selected district
              </p>
              {selected ? (
                <>
                  <h3 className="nd-assessment-name mt-2 text-xl font-bold text-slate-950">
                    {selected.district}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {selected.assessmentUnitCount} assessment units · {year}
                  </p>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {metricLabel}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-emerald-800">
                    {formatNumber(getMetricValue(selected, metric))} ha-m
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    ≈ {formatCubicMetres(getMetricValue(selected, metric))} m³ ·
                    {" "}
                    {formatLitres(getMetricValue(selected, metric))} litres
                  </p>
                  <dl className="mt-5 space-y-3 border-t border-slate-200 pt-4 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Recharge</dt>
                      <dd className="font-semibold text-slate-800">
                        {formatNumber(selected.annualRecharge)} ha-m
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Extraction</dt>
                      <dd className="font-semibold text-slate-800">
                        {formatNumber(selected.annualExtraction)} ha-m
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Net availability</dt>
                      <dd className="font-semibold text-slate-800">
                        {formatNumber(selected.netAvailability)} ha-m
                      </dd>
                    </div>
                  </dl>
                  <Link
                    className="nd-button-secondary mt-5 inline-flex min-h-10 items-center px-3 py-2 text-sm font-semibold transition"
                    href={`/app/explorer?district=${encodeURIComponent(selected.district)}&year=${year}`}
                  >
                    Explore {selected.district}
                    <span aria-hidden="true" className="ml-2">
                      →
                    </span>
                  </Link>
                </>
              ) : (
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Select a district on the map to see its aggregate metrics and
                  open its assessment units in Explorer.
                </p>
              )}
            </aside>
          </div>
        )}

        <p className="mt-6 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
          Resource values are stored and displayed in hectare-metres (ha-m).
          1 ha-m = 10,000 m³ = 10 million litres; these are volume conversions
          only, not additional water-availability calculations.
        </p>
      </section>

      <section
        aria-labelledby="district-comparison-title"
        className="nd-card nd-analysis-card"
      >
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="nd-eyebrow">
              Top districts
            </p>
            <h2
              className="nd-section-title mt-2"
              id="district-comparison-title"
            >
              Top 10 by {metricLabel.toLowerCase()}
            </h2>
          </div>
          <span className="text-sm text-slate-500">{year} · ha-m</span>
        </div>
        {aggregationError || topDistricts.length === 0 ? (
          <p className="nd-empty mt-6 rounded-xl border border-dashed p-5 text-sm">
            No district comparison values are available.
          </p>
        ) : (
          <div className="mt-6 space-y-4" role="list">
            {topDistricts.map((district, index) => {
              const value = getMetricValue(district, metric);
              return (
                <button
                  className="block w-full rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                  key={district.district}
                  onClick={() => setSelectedDistrict(district.district)}
                  type="button"
                >
                  <span className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-semibold text-slate-800">
                      {index + 1}. {district.district}
                    </span>
                    <span className="shrink-0 font-semibold text-slate-700">
                      {formatNumber(value)} ha-m
                    </span>
                  </span>
                  <span className="mt-2 block h-3 overflow-hidden rounded-full bg-slate-100">
                    <span
                      className="block h-full rounded-full bg-emerald-600 transition-all"
                      style={{ width: `${Math.max((value / maximum) * 100, 1)}%` }}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        )}
        <p className="mt-6 text-xs leading-5 text-slate-500">
          This is a visual comparison of stored district aggregates, not a risk
          ranking or policy recommendation.
        </p>
      </section>
    </>
  );
}
