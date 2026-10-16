# NeerDrishti Query Layer

## Purpose

`lib/groundwater-queries.server.ts` is the first controlled read layer over
`public.groundwater_assessments`. It keeps database access in one reusable
server-only module for future route handlers, server actions, or other
server-side application code.

The module uses the existing Supabase environment configuration and static
PostgREST filters. It does not change the normalized CSVs, schema, RLS policy,
or importer, and it does not re-import data.

The filename suffix `.server.ts` is an intentional boundary: this module must
not be imported by browser components or client-side code. The service-role
credential is read only inside this module from `SUPABASE_SERVICE_ROLE_KEY`;
it is not read from any `NEXT_PUBLIC_` variable and is never part of a browser
bundle.

## Functions and return shapes

Every function returns:

```ts
type QueryResult<T> =
  | { data: T; error: null }
  | { data: null; error: QueryError };

type QueryError = {
  code:
    | "INVALID_INPUT"
    | "NOT_FOUND"
    | "DATABASE_ERROR"
    | "CONFIGURATION_ERROR";
  message: string;
};
```

Database and configuration failures use generic messages. Raw Supabase error
objects, SQL, credentials, and internal connection details are not returned to
callers.

### `getDistricts()`

Returns a unique, alphabetically ordered `string[]` of district names. An
empty table produces `{ data: [], error: null }`.

### `getAssessmentUnits(district?)`

Returns a unique, alphabetically ordered `string[]` of assessment-unit names.
When `district` is supplied, the database rows are filtered to that exact
district after trimming surrounding whitespace. An unknown district produces
an empty successful result.

### `getAssessment(district, assessmentUnit, year?)`

Returns a complete `GroundwaterAssessment` record, including source fields and
the nullable stage percentage. `district` and `assessmentUnit` are required.
When `year` is omitted, the latest available year for the district/unit is
selected. When no matching record exists, the result is
`{ data: null, error: { code: "NOT_FOUND", ... } }`.

### `getDistrictSummary(district, year?)`

Returns:

```ts
{
  district: string;
  year: number | null;
  recordCount: number;
  assessmentUnitCount: number;
  totalAnnualRecharge: number;
  totalAnnualExtractableGroundwaterResource: number;
  totalGroundwaterExtraction: number;
  totalNetGroundwaterAvailability: number;
  classificationCounts: Record<GroundwaterClassification, number>;
}
```

The totals are sums of the corresponding stored source fields. The net
availability total uses the stored
`net_groundwater_availability_for_future_use` field; the query layer does not
derive or reinterpret a new availability formula. An unknown district
returns a zero-valued summary with all five classification counts present.

### `getClassificationSummary(year?)`

Returns the total row count and counts for exactly the five stored classes:
`critical`, `over_exploited`, `safe`, `salinity`, and `semi_critical`.

```ts
{
  year: number | null;
  totalCount: number;
  classificationCounts: Record<GroundwaterClassification, number>;
}
```

### `getTopExtractionAreas(year?, limit?, district?)`

Returns `TopExtractionArea[]`, ordered by stored `extraction` descending, then
district, assessment unit, and year for deterministic ties. The default limit
is 10 and the accepted range is 1–100. Each result includes district,
assessment unit, year, extraction, recharge, classification, nullable stage
percentage, and stored net availability for future UI use.

This is extraction-based ordering only. It is not a groundwater risk ranking
and does not invent a risk score.

When `district` is supplied, the same controlled query is restricted to that
exact district. This optional filter supports district-specific extraction
questions without creating a second data-access layer.

### `getDistrictComparison(year?)`

Returns one row per district with the requested year's stored resource totals:

```ts
{
  district: string;
  year: number | null;
  assessmentUnitCount: number;
  annualRecharge: number;
  annualExtractableResource: number;
  annualExtraction: number;
  netAvailability: number;
}[]
```

The function aggregates on the server from the controlled summary column list.
It is used by the analytics map and comparison chart, so raw assessment rows
and the service-role credential do not reach the browser.

## Validation rules

- Names must be non-empty strings after trimming.
- Years, when supplied, must be integers from 1 through 9999.
- Limits, when supplied, must be integers from 1 through 100.
- User values are passed through Supabase filter methods such as `eq`; they are
  never concatenated into SQL or a query string.
- The five classification values are validated when rows are read.
- Unexpected row shapes are treated as a generic database error.

Invalid input returns `INVALID_INPUT` without making a database request.
Empty list results are successful empty arrays. A missing single assessment is
an explicit `NOT_FOUND` result.

## Server boundary and local AI

The local Ollama assistant, or a browser client, must not receive direct
database credentials or direct database access. The authenticated chat route
calls these typed functions, applies authorization and response-size limits,
and passes only selected, sanitized results to the local model. The model does
not receive the Supabase service-role key and cannot generate SQL or query the
database directly. See `docs/local-ai-engine.md`.

RAG, embeddings, vector search, external AI APIs, and chat-history persistence
are not part of this layer.

## Validation command

With the local environment file available, run:

```text
node --env-file=.env.local scripts/validate-groundwater-query-layer.mjs
```

The validation script checks 36 unique districts, 350 unique assessment units,
the 2024 row total of 359, a known district summary, a complete known
assessment, deterministic extraction ordering and limit handling, invalid
inputs, an unknown district empty result, and generic error handling without
credential leakage.
