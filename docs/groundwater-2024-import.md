# 2024 Groundwater Import

## Status

The deterministic import tool and local source validation are complete. The
actual Supabase database import was **not performed** because this repository
does not contain a configured target Supabase project connection or a
service-role credential.

The local Ticket 10 migration exists, but whether it has been applied to a
remote database is **unknown**. No second migration was created and the Ticket
10 migration was not modified.

## Source and target

- Source: `data/processed/groundwater_2024_normalized.csv`
- Target: `public.groundwater_assessments`
- Source rows read: 359
- Source columns: 24
- Database rows successfully imported: 0 confirmed
- Database rows rejected: 0 observed; no database write was attempted
- Database validation queries: not run because database access was unavailable

The local source validator found zero rejected rows. Thus, all 359 source
records are valid and ready for import once safe database access is supplied.

## Ticket 11A connection verification

The repository was checked for a safe Supabase connection before any import:

- Supabase CLI available: **No**.
- Repository linked to a Supabase project: **Unknown**; there is no
  `supabase/config.toml`, linked project metadata, or configured project
  reference in the repository.
- Connection verified: **No**.
- Project identity verified: **Unknown**.
- Ticket 10 migration status on the remote project: **Unknown**.
- Groundwater records imported during Ticket 11A: **0**.

The existing `lib/supabase.ts` client uses only the public
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` variables. The
local process had none of the URL, anon-key, or service-role variables
configured. The import tool keeps `SUPABASE_SERVICE_ROLE_KEY` server-side and
never uses it in browser code; no credential value was written to the
repository or documentation.

The `.gitignore` already protects `.env*` files, and `.env.example` contains
only empty placeholders. No `.env` file is present in the repository.

Before a future import, the user must provide the non-secret Supabase project
reference ID and confirm that it is the intended development project. The
corresponding project URL and a server-side service-role credential must then
be configured locally through an ignored environment file or secure shell
environment; secret values must not be pasted into chat or committed. Once the
project identity and connection are verified, the existing migration/import
workflow can be run separately.

## Ticket 11B project-linking status

The intended Supabase development project reference is:

`wpslyhjcoccpidftiqqv`

This reference was supplied for this ticket and is not a secret. The standard
Supabase CLI is not installed in the environment, and the repository has no
`supabase/config.toml` or linked-project metadata. Consequently:

- Repository linked to the specified project: **No**.
- Project identity independently verified: **No**.
- Read-only Supabase connection verified: **No**.
- Ticket 10 migration applied in this ticket: **No**.
- Groundwater records imported in this ticket: **0**.

The existing `@supabase/supabase-js` dependency is a supported application
connection path, but it requires the local public URL and anon key for a
read-only check. Neither is configured in the current process. The future
import still additionally requires the server-side
`SUPABASE_SERVICE_ROLE_KEY`; it must remain local and must never be placed in
client code, `.env.example`, or documentation.

Manual setup required before the next database operation: install/authenticate
the Supabase CLI in the local development environment and link this repository
with `wpslyhjcoccpidftiqqv`, or configure the project's public URL and anon key
locally for a read-only check. The service-role credential must be configured
locally through a secure ignored environment mechanism when the separate
import ticket is explicitly run. No secret should be pasted into chat.

## Ticket 11C runtime connection status (superseded by Ticket 11D)

For the confirmed project reference `wpslyhjcoccpidftiqqv`, the expected
Supabase URL is:

`https://wpslyhjcoccpidftiqqv.supabase.co`

The existing client in `lib/supabase.ts` expects
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Neither
variable is configured in the local process, and no `.env.local` file exists.
The project URL was therefore not written as a partial configuration without
the matching anon key.

- Project URL configured locally: **No**.
- Local Supabase environment configured: **No**.
- Supabase client initialization: **Not possible** because required variables
  are absent.
- Read-only connection test: **Not possible**.
- Table-not-yet-created versus connection failure: **Not distinguishable**
  until the client can initialize and make a request.
- Migration applied: **No**.
- Groundwater records imported: **0**.

The remaining manual step is to obtain the anon/public key for project
`wpslyhjcoccpidftiqqv` from the Supabase dashboard and configure it locally,
without pasting it into chat or committing it. The ignored local environment
configuration must contain the expected project URL above and that anon key.
After that, a safe read-only request can distinguish a reachable project with
an unapplied migration from a connection/configuration failure.

## Ticket 11D database setup status

The local environment now contains the required project URL and anon/public
key, and the URL matches the intended project exactly:

`https://wpslyhjcoccpidftiqqv.supabase.co`

The existing client initialized successfully and completed a safe read-only
query against `public.groundwater_assessments`. The target project and table
were therefore reachable. The table currently contains **0 rows**. An
explicit read-only query of all 30 migration-defined columns also succeeded.

The migration was not executed in this ticket because the target table already
exists and the existing migration must not be recreated. The read-only column
shape matches the migration. Constraint and policy catalog details that are
not exposed through the anon client remain pending service-role/CLI
verification; the successful anon read is consistent with the intended public
read policy.

The importer was run with the local environment. It validated all 359 source
rows, then stopped before any write because `SUPABASE_SERVICE_ROLE_KEY` is not
configured. No rows were imported, no database records were modified, and no
credentials were printed. The anon key was not used for writes.

Current result:

- Supabase connection: **Pass**.
- Project URL match: **Pass**.
- Table exists: **Yes**.
- Migration execution in Ticket 11D: **No**; existing table detected.
- Database row count: **0**.
- Groundwater import: **Pending**.
- Database-level data validation: **Pending until server-side write access is
  configured**.

The next manual step is to configure the server-side `SUPABASE_SERVICE_ROLE_KEY`
locally through the ignored environment mechanism before the separate import
operation. It must not be placed in client code, committed, or pasted into
chat.

## Ticket 11E privileged import attempt

The required local variables were present, and the configured URL matched
`https://wpslyhjcoccpidftiqqv.supabase.co`. A privileged read-only query found
the target table and confirmed an initial row count of **0**. The explicit
query of the migration-defined columns also succeeded before the import.

The existing importer then validated all 359 source rows and attempted the
idempotent upsert. Every row was rejected with the same PostgREST error:

`PGRST205: Could not find the table 'public.groundwater_assessments' in the schema cache`

The importer reported 359 rejected rows and zero successful rows. It did not
modify either CSV, and no rollback was necessary because no upsert returned a
successful result. The last confirmed database count before the attempt was
0. Subsequent privileged and anon reads also returned `PGRST205`, so the
post-failure database row count cannot be re-read from this environment and is
not claimed to be 0.

The expected column shape was readable before the write attempt, but full
catalog verification of the primary key, logical unique constraint,
classification check, RLS state, and policy definitions was not available
through the current PostgREST access path. No migration or schema change was
run in this ticket. The anon read/security test was not treated as passing
after the schema-cache failure, and no second import was attempted.

The remaining blocker is remote Supabase/PostgREST schema-cache or migration
state. The project administrator must refresh/reload the PostgREST schema
cache and verify the target table and Ticket 10 constraints through the
Supabase SQL/CLI administration path. After that is resolved, rerun the
existing importer and then perform the database validation and idempotency
run. No credentials or service-role values are recorded here.

## Ticket 11F schema-cache diagnosis

No importer, migration, schema refresh, or write operation was run in this
ticket.

The local migration, schema documentation, import documentation, and importer
were inspected. The configured environment contains the project URL, anon key,
and service-role key, but it does not contain a Supabase access token, database
password, direct database URL, or Supabase CLI configuration.

The service-role client cannot query PostgreSQL catalogs through the current
PostgREST endpoint: safe requests to both `information_schema` and
`pg_catalog` returned `PGRST106`, meaning those schemas are not exposed by the
API. A normal table request currently returns `PGRST205` for
`public.groundwater_assessments`.

Consequently, the remote PostgreSQL state is **unknown** from this environment:

- whether the table exists in PostgreSQL cannot be established;
- whether it is in the `public` schema cannot be catalog-verified;
- exact columns, owner, primary key, unique constraint, classification check,
  RLS state, and policies cannot be catalog-verified;
- the root cause of `PGRST205` is not established as either a missing table or
  a stale PostgREST schema cache;
- no cache refresh was performed because the safety precondition (confirmed
  matching PostgreSQL table) was not met.

The last confirmed database row count before the Ticket 11E write attempt was
0. Ticket 11E returned no successful upsert and did not perform a rollback;
the current count cannot be re-read while PostgREST returns `PGRST205`. No
destructive operation occurred, no duplicate table was created, and both CSV
files remain unchanged.

The next safe step requires the project administrator's Supabase SQL Editor,
Supabase CLI linked to `wpslyhjcoccpidftiqqv`, Management API access, or a
direct database connection. That privileged administration path must first
inspect the PostgreSQL catalog and compare the actual object with the Ticket
10 migration. Only if the matching table is confirmed should the standard
PostgREST schema reload mechanism be used.

## Ticket 11G migration status

The user confirmed through the Supabase SQL Editor that
`public.groundwater_assessments` does not exist in the remote database. The
Ticket 10 migration was read locally and remains unchanged.

The local environment has the expected project URL and keys, but there is no
safe SQL execution mechanism available from this repository:

- Supabase CLI: not installed
- `psql`: not installed
- direct database URL/password: not configured
- Supabase Management API access token: not configured
- existing SQL-execution RPC: not present in the configured client/API

The service-role key is not itself a PostgreSQL connection or arbitrary SQL
execution channel. Therefore the existing migration was **not applied**, no
schema/cache operation was attempted, and the remote database remains
unchanged. The importer was not run and the expected database row count
remains 0 because the table is still absent.

The exact next step is for the project administrator to open the Supabase SQL
Editor for project `wpslyhjcoccpidftiqqv`, execute the existing migration file
`supabase/migrations/20260922152344_create_groundwater_schema.sql` unchanged,
and verify the table, constraints, and RLS there. Once that is complete, the
normal PostgREST read can be rechecked before a later ticket imports data. No
credentials are recorded in this document.

## Ticket 11H final import result

The remote schema was subsequently applied and manually verified in the
Supabase SQL Editor before this import. The target project is
`wpslyhjcoccpidftiqqv`, and the verified table has 30 columns, RLS enabled, a
public read policy, a generated UUID primary key, the logical unique key
`(district, assessment_unit, year)`, and the normalized classification check.

Initial database state:

- row count: 0
- table: `public.groundwater_assessments`

The existing importer was run twice using the server-side credential. Both
runs validated the source CSV and processed all 359 rows. The first run
successfully upserted 359 rows with 0 rejected rows. The second run also
upserted 359 logical records without creating duplicates.

Final database validation from the actual Supabase database:

| Check | Result |
|---|---:|
| Rows | 359 |
| Districts | 36 |
| Assessment-unit names | 350 |
| Year values | `2024` only |
| `safe` | 302 |
| `semi_critical` | 41 |
| `critical` | 7 |
| `over_exploited` | 8 |
| `salinity` | 1 |
| Duplicate logical keys | 0 |
| NULL stage percentages | 1 |

The importer compared every mapped source field against the database,
including representative records `Ahmednagar / Akola / 2024` and `Amravati /
Daryapur / 2024`. The comparison was an exact match, numeric database fields
were returned as numbers, and the known missing stage percentage remained
`NULL`.

The anon/public client successfully read the populated table and returned 359
rows. Public write protection is based on the verified RLS configuration: the
public read policy exists and no public INSERT, UPDATE, or DELETE policy was
created. No unsafe public write request was issued.

The second importer run confirmed idempotency: the final row count remained
359 and duplicate logical keys remained 0. Neither CSV was modified, no
destructive database operation was performed, and no credentials are recorded
in this document.

Remaining source-data uncertainties are unchanged: assessment-unit/block
semantics and some source units remain uncertain, and the one missing stage
percentage is intentionally retained as `NULL`.

## Import method

The repeatable importer is:

`scripts/import-groundwater.mjs`

Commands:

```text
node scripts/import-groundwater.mjs --validate
node scripts/import-groundwater.mjs --import
```

`--validate` reads and validates the local CSV without contacting Supabase.
`--import` performs the same local validation first, then uses the existing
`@supabase/supabase-js` dependency with a service-role key to upsert rows and
query the database for post-import validation.

The repository currently contains only the public client variables in
`.env.example` (`NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY`). There is no local `.env` configuration,
`supabase/config.toml`, or Supabase CLI project configuration, and no
`SUPABASE_SERVICE_ROLE_KEY` is configured. The importer therefore stopped
before making a database request. It never prints or stores credential values.

The Ticket 10 RLS policy intentionally allows public reads but no public
writes, so the public anon key is not used for importing.

## Explicit CSV-to-database mapping

The importer maps every normalized CSV field explicitly to the corresponding
database field:

| CSV field | Database field | Handling |
|---|---|---|
| `district` | `district` | Text preserved |
| `assessment_unit` | `assessment_unit` | Text preserved; not globally unique |
| `year` | `year` | Parsed integer; validated as 2024 |
| `recharge` | `recharge` | Parsed numeric value |
| `extraction` | `extraction` | Parsed numeric value |
| `classification` | `classification` | Exact normalized value preserved |
| `state_code` | `state_code` | Text preserved |
| `district_code` | `district_code` | Text preserved |
| `assessment_unit_code` | `assessment_unit_code` | Text preserved |
| `source_serial_number` | `source_serial_number` | Parsed integer |
| `total_geographical_area` | `total_geographical_area` | Parsed numeric value; no unit conversion |
| `recharge_worthy_area` | `recharge_worthy_area` | Parsed numeric value; no unit conversion |
| `recharge_from_rainfall_monsoon` | `recharge_from_rainfall_monsoon` | Parsed numeric value |
| `recharge_from_other_sources_monsoon` | `recharge_from_other_sources_monsoon` | Parsed numeric value |
| `recharge_from_rainfall_non_monsoon` | `recharge_from_rainfall_non_monsoon` | Parsed numeric value |
| `recharge_from_other_sources_non_monsoon` | `recharge_from_other_sources_non_monsoon` | Parsed numeric value |
| `total_natural_discharges` | `total_natural_discharges` | Parsed numeric value |
| `annual_extractable_groundwater_resource` | `annual_extractable_groundwater_resource` | Parsed numeric value |
| `irrigation_use` | `irrigation_use` | Parsed numeric value |
| `industrial_use` | `industrial_use` | Parsed numeric value |
| `domestic_use` | `domestic_use` | Parsed numeric value |
| `annual_gw_allocation_for_domestic_use_as_on_2025` | `annual_gw_allocation_for_domestic_use_as_on_2025` | Parsed numeric value; source wording retained |
| `net_groundwater_availability_for_future_use` | `net_groundwater_availability_for_future_use` | Parsed numeric value |
| `stage_of_groundwater_extraction_percent` | `stage_of_groundwater_extraction_percent` | Blank becomes JavaScript `null`, then database `NULL` |

The importer adds `source_year`, `source_document`, and `source_reference`
from the documented 2024 report metadata. `id`, `created_at`, and
`updated_at` remain database-managed fields.

## Local validation result

`node scripts/import-groundwater.mjs --validate` completed successfully:

| Check | Result |
|---|---:|
| Rows read | 359 |
| CSV fields | 24 |
| Rows rejected | 0 |
| Districts | 36 |
| Assessment-unit names | 350 |
| Year values | `2024` only |
| Classification values | `critical`, `over_exploited`, `safe`, `salinity`, `semi_critical` |
| Duplicate logical keys | 0 |
| Missing stage values | 1 |

The one missing stage value is preserved as `null` for source record 29
(`Amravati` / `Daryapur`). Missing values are never changed to zero.

The importer also validates numeric fields before any future write. Source
numeric values are parsed as finite numbers and are sent to the PostgreSQL
`numeric` columns without rounding or unit conversion.

## Database validation that remains pending

Once a safe authenticated target is configured, `--import` will:

1. Upsert all 359 records.
2. Use `(district, assessment_unit, year)` as the conflict target.
3. Query the target table with an exact row count.
4. Verify 359 rows, year 2024, 36 districts, 350 assessment units, and the
   five expected classifications.
5. Check duplicate logical keys and the preserved `NULL` stage value.
6. Compare every mapped field for every source row, including representative
   records from the first row and source record 29.
7. Verify database-returned numeric columns are numeric values and were not
   returned as text.

No delete or table-clearing operation is performed. Re-running the importer
is idempotent because it uses an upsert conflict target matching the validated
logical key. Existing unrelated rows are not deleted; if they make the target
count differ from 359, validation reports the mismatch instead.

## Unresolved issues

- Remote migration application status is unknown because no target connection
  is configured.
- Remote import and database-level validation remain pending.
- Assessment-unit/block semantics and several source units remain uncertain as
  documented in `docs/groundwater-2024-normalization.md` and
  `docs/database-schema.md`.
- No source or raw CSV was modified during this ticket.
