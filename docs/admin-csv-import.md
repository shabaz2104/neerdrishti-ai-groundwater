# Administrator CSV imports

## Contract and scope

`/admin/groundwater/import` is reached through **Import CSV** in the existing record manager. It accepts the exact 24 headers in `data/processed/groundwater_2024_normalized.csv`; column order may vary. The page provides a header-only template.

```text
district,assessment_unit,year,recharge,extraction,classification,state_code,district_code,assessment_unit_code,source_serial_number,total_geographical_area,recharge_worthy_area,recharge_from_rainfall_monsoon,recharge_from_other_sources_monsoon,recharge_from_rainfall_non_monsoon,recharge_from_other_sources_non_monsoon,total_natural_discharges,annual_extractable_groundwater_resource,irrigation_use,industrial_use,domestic_use,annual_gw_allocation_for_domestic_use_as_on_2025,net_groundwater_availability_for_future_use,stage_of_groundwater_extraction_percent
```

System-managed columns (`id`, timestamps, `updated_by`) and arbitrary provenance columns are rejected. `year` must be `2024` and `state_code` must be `MH`. This does not introduce historical-year support. Current source coverage remains 359 assessments, 36 districts and 350 unique unit names; imports may change live database counts.

The file limit is **512 KiB (524,288 bytes)** and the data-row limit is **1,000**. The existing normalized CSV is 70,372 bytes, so this permits moderate additions while bounding parsing and database work. CSV records are limited to 16 KiB. Files must have a `.csv` extension, a compatible CSV/text MIME type (or an empty/generic binary type), and valid UTF-8 bytes; an optional UTF-8 BOM is supported. Empty, header-only, binary, malformed, oversized and excess-row files are rejected.

`csv-parse/sync` handles quoted commas, escaped quotes and CR/LF line endings. Text is trimmed, required identifiers are bounded, and control characters in identifiers are rejected. Every numeric field is checked against an explicit decimal grammar: exponent notation, NaN, Infinity, nonnumeric values and required blanks are invalid. Values remain decimal strings until PostgreSQL casts them, avoiding JavaScript rounding. Legitimate signed values and zeros are preserved, matching the source-faithful numeric schema. Only an empty `stage_of_groundwater_extraction_percent` becomes `NULL`. Source serial numbers must be positive 32-bit integers. Classification must be exactly `safe`, `semi_critical`, `critical`, `over_exploited` or `salinity`.

Volumes retain ha-m, stage retains percent, and counts have no volume unit. Area/component units that are unresolved in the source documentation are not converted or relabelled.

## Preview and explicit confirmation

1. The administrator selects a file and chooses **Validate file**.
2. The Server Action calls `requireAdmin()`, validates the file, parses all rows, and flags every occurrence of duplicate `(district, assessment_unit, year)` keys.
3. Valid rows are compared with stored data by the read-only `preview_groundwater_csv` function. No audit or groundwater writes occur during preview.
4. The report shows total, valid, new, unchanged, conflict and invalid counts, plus row details. Invalid rows block confirmation of the entire file. Valid new rows may be imported alongside conflicts, which remain untouched.
5. **Import N new records** is an explicit second action. The browser resends the retained File, a confirmation value and its preview SHA-256. The action independently calls `requireAdmin()`, checks the file hash and reparses/revalidates every row. Browser-supplied row JSON and summary counts are never accepted as the import representation.

The file stays in browser memory between phases and request memory on the server. Uploads are never saved to disk or placed in `public`, `app`, `data/raw` or `data/processed`.

CSV row numbers are logical records, including the header as row 1; a quoted multiline field counts as one record. File replacement clears the preview. After any failed confirmation, the administrator validates again to obtain current database comparisons.

## Comparison and concurrency

- **NEW**: no existing logical key; insert after confirmation.
- **UNCHANGED**: all 24 imported fields are equivalent; skip.
- **CONFLICT**: the key exists but an imported value differs; skip and show the conflict. The existing single-record editor is the path for corrections.

Comparison occurs in PostgreSQL using numeric values, so `1.0` and `1.00` are equivalent. It excludes generated IDs, lifecycle/audit fields and derived upload provenance; otherwise reuploading the normalized CSV would conflict with every legacy imported row simply because its original report provenance differs.

At confirmation `import_groundwater_csv` validates the structured rows again and processes keys in a stable order. `INSERT ... ON CONFLICT (district, assessment_unit, year) DO NOTHING` is the final uniqueness guard. A conflicting insert is followed by a fresh locked read and classified as unchanged or conflict. A record inserted or changed after preview is never overwritten. The final report contains confirmation-time outcomes, which may differ from preview counts. Keys disappearing mid-operation produce a retry error.

All insertions and the audit entry execute in **one RPC transaction**. Any unexpected database/audit failure rolls back the entire batch. No partial-success count is returned. If the network fails after a commit, validation/retry is safe because the logical keys make reupload idempotent; a retry can produce an additional audit entry but cannot duplicate records. The action reports that the outcome was not confirmed rather than promising no writes after a transport error.

## Authorization and migration

New migration: `supabase/migrations/20261015120000_add_admin_csv_import.sql`. It follows the existing schema and admin-role migrations without modifying either.

Every Server Action independently calls `requireAdmin()` using the existing Supabase session and role table. The page also calls the guard because child rendering can run alongside layout rendering. All three callable PostgreSQL functions (`validate_groundwater_csv_rows`, `preview_groundwater_csv`, `import_groundwater_csv`) independently check `public.is_admin()`, use `SECURITY INVOKER` and an empty search path, and contain no dynamic SQL. Anonymous execution is revoked. The functions validate allowed keys, row limits, types, year, state, classification and duplicate keys.

Column-scoped INSERT grants are added for the 24 input columns and three derived provenance columns. The INSERT RLS policy additionally requires `is_admin()`, year/source_year 2024, and state MH. Existing admin-only UPDATE behavior is unchanged. DELETE remains unavailable. Normal and anonymous users retain read-only access. No service-role key, secret, admin password or new environment variable is required.

## Provenance and audit

An arbitrary CSV cannot prove that its contents came from CGWB. For newly inserted rows the server/database derive:

- `source_year`: 2024;
- `source_document`: `Administrator CSV upload (unverified source)`;
- `source_reference`: file SHA-256 plus logical CSV row number;
- `source_serial_number`: validated source identifier supplied in the normalized schema.

Existing records and their source provenance are untouched. Original repository CSVs and PDFs remain immutable. A CSV upload therefore adds live database records without claiming official certification.

`public.dataset_imports` stores the administrator UUID, sanitized original filename, SHA-256, completion time/status, total/new/inserted/unchanged/conflict/invalid counts and generated import ID. `new_rows` records actual insertable rows at confirmation and equals `inserted_rows`. Invalid files are never imported, so committed audit records have `invalid_rows = 0`. Preview and failed transactions create no durable audit record. Raw CSV content and auth secrets are not stored.

The log table has admin-only SELECT and INSERT RLS and no public access; `uploaded_by` is checked against `auth.uid()`. It does not expose admin UUIDs through groundwater's public read surface. Administrators can inspect logs through trusted Supabase administration or their role-filtered database session. The existing `updated_by` trigger continues to describe later corrections, while the import log attributes insertion batches.

## Verification and safe testing

Run `node scripts/validate-admin-csv-import.mjs` for real parser fixtures, direct Server Action calls with isolated authorization adapters, and structural security checks. This covers invalid and unauthorized requests without writing to a deployed database.

For PostgreSQL policy and transaction tests, install `@electric-sql/pglite` into a disposable directory outside the repository, then run:

```text
node scripts/test-admin-csv-database.mjs <temporary-dependency-directory>
```

The test script applies all three migrations to in-memory PostgreSQL and provides local `auth.users`/`auth.uid()` fixtures. The unused pgcrypto extension statement is omitted because this runtime already has `gen_random_uuid()`. Tests exercise actual RLS and functions for anonymous and normal-user denial, direct INSERT denial, admin insertion, unchanged/conflict/mixed outcomes, numeric equivalence, preview/confirm interleaving, duplicate/payload rejection, audit privacy and rollback after an injected audit failure. No production record is written. PGlite is a test dependency installed outside the app; it is not a runtime dependency or browser asset.

Before deployment, apply the new migration to the intended Supabase project. Then use real isolated admin and normal accounts to verify session cookies, route denial, direct action denial, template download, file selection/report rendering, validation errors, explicit confirmation, final audit information and responsive layouts. Use a disposable Supabase project for successful NEW imports. Do not add synthetic records to the verified production dataset for testing. Live-session checks remain necessary even when local PostgreSQL tests pass.
