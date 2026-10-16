"use client";

import { useEffect, useRef, useState } from "react";
import { loadDistrictBoundaries } from "./district-boundaries";
import type { DistrictGeoJson } from "./map-types";

export function useDistrictBoundaries(disabled = false, initialAnchors?: readonly string[]) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [geoJson, setGeoJson] = useState<DistrictGeoJson | null>(null);
  const [boundaryError, setBoundaryError] = useState(false);
  useEffect(() => {
    // A streamed route can arrive after Next's first hash-scroll attempt.
    // Honor the existing Map link once its real heading has mounted.
    const anchor = window.location.hash.slice(1);
    if (initialAnchors?.includes(anchor)) {
      document.getElementById(anchor)?.scrollIntoView({ behavior: "instant", block: "start" });
    }
    if (disabled || !frameRef.current) return;
    let cancelled = false;
    let observer: IntersectionObserver | undefined;
    function load() {
      observer?.disconnect();
      void loadDistrictBoundaries().then((data) => { if (!cancelled) setGeoJson(data); })
        .catch(() => { if (!cancelled) setBoundaryError(true); });
    }
    // Preload shortly before the map scrolls into view; do not parse 6.6 MB
    // or mount Leaflet for an offscreen mobile/Analytics map.
    if (typeof IntersectionObserver === "undefined") load();
    else {
      observer = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) load(); }, { rootMargin: "200px" });
      observer.observe(frameRef.current);
    }
    return () => { cancelled = true; observer?.disconnect(); };
  }, [disabled, initialAnchors]);
  return { frameRef, geoJson, boundaryError };
}
