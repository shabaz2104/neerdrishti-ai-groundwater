# Maharashtra District Map

## Asset and provenance

The interactive map uses the committed static asset
`public/maps/maharashtra-districts.geojson`. It was retrieved on 2026-09-23
from the official BharatMap GIS service's district layer:

<https://mapservice.gov.in/gismapservice/rest/services/BharatMapService/Admin_Boundary_District/MapServer/1>

The query requests Maharashtra features, GeoJSON output, WGS 84 coordinates
(`EPSG:4326`), and coordinate precision 4. The service response contained 36
Maharashtra district features. The static file retains the source district
name, district code, state code, and source year in each feature's properties,
and adds the normalized `district` property used for the groundwater match.

The service metadata describes the layer as administrative boundaries updated
through October 2017, coded with Census 2011 codes, and sourced from
simplified 1:50,000-scale topographic map data. Those statements are source
metadata, not a claim that the map represents current administrative changes.
The map is therefore suitable for visual district context, not legal boundary
or cadastral decisions.

The service does not expose a separate application license in its layer
metadata. The app preserves the government source URL and metadata in this
document and in the asset's top-level `metadata` member. Confirm any
deployment-specific reuse requirements with the service owner before
redistributing the boundary data outside this project.

## Matching layer

The groundwater CSV preserves these legacy names while the map source uses
newer names:

| Map source | Groundwater dataset |
|---|---|
| `Ahilyanagar` | `Ahmednagar` |
| `Chhatrapati Sambhajinagar` | `Aurangabad` |
| `Dharashiv` | `Osmanabad` |
| `Mumbai Suburban` | `Mumbai Sub` |
| `Yavatmal` | `Yawatmal` |

All other source names match the normalized groundwater district names exactly.
The preparation script fails if a source name has no explicit match or if the
normalized names are not unique. Unmatched map features are rendered grey and
are not assigned an aggregate by fuzzy matching.

## UI and attribution

Groundwater values are aggregated server-side by `getDistrictComparison(2024)`
and the browser receives one row per district. The map supports metric
selection, hover tooltips, click selection, a legend, a top-10 comparison, and
an Explorer link for the selected district. Leaflet tiles display the required
OpenStreetMap attribution in the map control; tiles are not bundled in this
repository.

Resource and extraction metrics use the source unit `ha-m` (hectare-metre).
The UI explains the volume equivalence `1 ha-m = 10,000 m³ = 10 million
litres` as a conversion only. No derived risk score or availability formula is
introduced.

## Validation

Regenerate and validate the static asset with:

```text
node scripts/prepare-maharashtra-districts.mjs
node scripts/validate-maharashtra-map.mjs
```

The preparation command needs access to the BharatMap service. In restricted
environments, download the documented endpoint response to a local file and
pass that file path as the script argument; normalization and all checks are
the same.
