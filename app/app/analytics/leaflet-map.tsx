"use client";

import { useEffect, useRef } from "react";
import {
  GeoJSON,
  MapContainer,
  TileLayer,
  useMap,
} from "react-leaflet";
import * as L from "leaflet";
import type { Feature, Geometry } from "geojson";
import type { PathOptions } from "leaflet";
import "leaflet/dist/leaflet.css";

import type {
  DistrictComparison,
  DistrictGeoJson,
  DistrictGeoJsonProperties,
  MapMetric,
} from "./map-types";

type LeafletMapProps = {
  districts: DistrictComparison[];
  geoJson: DistrictGeoJson;
  metric: MapMetric;
  selectedDistrict: string | null;
  onSelectDistrict: (district: string) => void;
  compact?: boolean;
};

const metricFields: Record<MapMetric, keyof DistrictComparison> = {
  annualExtraction: "annualExtraction",
  annualRecharge: "annualRecharge",
  annualExtractableResource: "annualExtractableResource",
  netAvailability: "netAvailability",
};

const metricLabels: Record<MapMetric, string> = {
  annualExtraction: "Extraction",
  annualRecharge: "Recharge",
  annualExtractableResource: "Extractable resource",
  netAvailability: "Net availability",
};

const numberFormatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
function formatNumber(value: number) { return numberFormatter.format(value); }

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getMetricValue(
  district: DistrictComparison | undefined,
  metric: MapMetric,
) {
  if (!district) {
    return null;
  }

  return district[metricFields[metric]] as number;
}

function getDistrictName(
  feature: Feature<Geometry, DistrictGeoJsonProperties>,
) {
  return feature.properties?.district ?? null;
}

function getColor(value: number | null, minimum: number, maximum: number) {
  if (value === null) {
    return "#cbd5e1";
  }

  const range = maximum - minimum;
  const normalized = range === 0 ? 0.5 : (value - minimum) / range;
  if (normalized >= 0.8) return "#065f46";
  if (normalized >= 0.6) return "#047857";
  if (normalized >= 0.4) return "#0d9488";
  if (normalized >= 0.2) return "#38bdf8";
  return "#bae6fd";
}

function DistrictLayer({
  districts, geoJson, metric, selectedDistrict, onSelectDistrict,
}: LeafletMapProps) {
  const map = useMap();
  const layerRef = useRef<L.GeoJSON>(null);

  useEffect(() => {
    // Use the already-built layer instead of constructing 372k vertices again
    // only to obtain its bounds. Selection/metric changes must not reset zoom.
    const bounds = layerRef.current?.getBounds();
    if (bounds?.isValid()) map.fitBounds(bounds, { padding: [18, 18] });
  }, [geoJson, map]);

  useEffect(() => {
    const districtByName = new Map(districts.map((district) => [district.district, district]));
    const values = districts.map((district) => getMetricValue(district, metric)).filter((value): value is number => value !== null);
    const minimum = Math.min(...values, 0);
    const maximum = Math.max(...values, 0);
    const cleanups: (() => void)[] = [];

    layerRef.current?.eachLayer((layer) => {
      const path = layer as L.Path & { feature?: Feature<Geometry, DistrictGeoJsonProperties> };
      const districtName = path.feature ? getDistrictName(path.feature) : null;
      if (!districtName || !(layer instanceof L.Path)) return;
      const summary = districtByName.get(districtName);
      const value = getMetricValue(summary, metric);
      const selected = districtName === selectedDistrict;
      const style: PathOptions = {
        color: selected ? "#0f172a" : "#ffffff",
        fillColor: getColor(value, minimum, maximum),
        fillOpacity: selected ? 0.9 : 0.75,
        weight: selected ? 2.5 : 1,
      };
      layer.setStyle(style);
      const tooltip = summary
        ? "<strong>" + escapeHtml(districtName) + "</strong><br />" + metricLabels[metric] + ": " + formatNumber(value ?? 0) + " ha-m<br />Extraction: " + formatNumber(summary.annualExtraction) + " ha-m<br />" + summary.assessmentUnitCount + " assessment units<br />Click for details"
        : "<strong>" + escapeHtml(districtName) + "</strong><br />No matched groundwater aggregate";
      if (layer.getTooltip()) layer.setTooltipContent(tooltip);
      else layer.bindTooltip(tooltip, { sticky: true });
      const handlers = {
        click: () => onSelectDistrict(districtName),
        mouseover: () => { layer.setStyle({ color: "#0f172a", weight: 2.5, fillOpacity: 0.9 }); layer.bringToFront(); },
        mouseout: () => { layer.setStyle(style); },
      };
      layer.on(handlers);
      cleanups.push(() => { layer.off(handlers); });
    });
    return () => { cleanups.forEach((cleanup) => cleanup()); };
  }, [districts, geoJson, metric, selectedDistrict, onSelectDistrict]);

  // Keep the geometry mounted. Only styles, tooltips and handlers change.
  return <GeoJSON data={geoJson} ref={layerRef} />;
}

export default function LeafletMap(props: LeafletMapProps) {
  const { compact = false } = props;
  return (
    <MapContainer
      center={[19.75, 75.7]}
      className={`h-full w-full rounded-xl ${compact ? "min-h-[20rem]" : "min-h-[28rem]"}`}
      scrollWheelZoom
      // Avoid Leaflet 1.9's delayed zoom callback after route unmount, and
      // keep zoom responsive with the full-resolution district geometry.
      zoomAnimation={false}
      zoom={7}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <DistrictLayer {...props} />
    </MapContainer>
  );
}
