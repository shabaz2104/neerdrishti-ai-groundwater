# NeerDrishti admin panel

## Architecture and routes

NeerDrishti administration uses the existing Supabase Auth session. There is no second credential store and no admin password in application configuration. `/admin/login` signs in with `signInWithPassword`; successful authentication navigates to `/admin`, where the server checks the role before rendering.

The routes are:

- `/admin/login` — dedicated administrator entry.
- `/admin` — operational overview using real groundwater totals.
- `/admin/groundwater` — server-filtered, 25-row paginated record manager.
- `/admin/groundwater/[id]` — record inspection and controlled correction form.
- `/admin/groundwater/import` — validate and explicitly confirm safe CSV additions (Ticket 25).

The protected route group has a server layout. `getAdminAccess()` verifies the current user with `auth.getUser()` and looks up that same user in `public.user_roles`. `requireAdmin()` is the reusable mutation/data-access guard. Unauthenticated visitors are redirected to `/admin/login`; authenticated users without the role are redirected to `/admin/login?error=unauthorized` and receive a generic denial. The record update Server Action calls `requireAdmin()` again immediately before reading or writing because rendering a protected page does not authorize a later POST.

## Role and RLS model

Migration `20261001120000_add_admin_authorization.sql` creates `public.user_roles` with `(user_id, role)` as its primary key, a foreign key to `auth.users`, and an allow-list constraint containing only `admin`. Authenticated users can read only their own role row. Browser users cannot insert, update or delete roles.

The migration adds `public.is_admin()`, a stable `security definer` function whose search path is empty. Groundwater updates use the caller's ordinary authenticated Supabase session; no service-role key is used by the admin panel. The existing public/anonymous SELECT policy remains intact. UPDATE is granted only for the approved correction columns and an RLS policy permits a row update only when `is_admin()` is true. Ticket 25 adds an admin-only INSERT policy for CSV ingestion in a new migration. DELETE remains unavailable.

This gives two enforcement layers:

1. the Server Action verifies the authenticated user and database role;
2. PostgreSQL RLS independently denies the update unless the caller has the admin role.

## First administrator bootstrap

Apply all repository migrations to the intended Supabase project first. Then create/sign up the administrator through the normal Supabase Auth flow. In the trusted Supabase SQL editor, identify the exact Auth user UUID and insert the role explicitly:

```sql
select id, email from auth.users order by created_at;

insert into public.user_roles (user_id, role)
values ('REPLACE_WITH_VERIFIED_AUTH_USER_UUID', 'admin')
on conflict (user_id, role) do nothing;
```

Run this only in trusted database administration. Verify the UUID carefully; do not grant by email domain and do not place a personal email, UUID, password, token or service-role key in source control. To revoke access, delete that specific `user_roles` row through trusted database administration.

## Editable fields and validation

Administrators can edit the logical identity (`district`, `assessment_unit`, `year`), classification, canonical recharge/extraction values, area/recharge components, use/allocation measures, extractable resource, future availability and nullable stage of extraction. `id`, source codes, source serial number, `source_year`, source document/reference, creation time and audit fields are read-only.

The Server Action trims and bounds text, validates year as an integer from 1900–2100, restricts classification to the five schema-approved values, explicitly parses every numeric field, rejects non-finite or negative measures, and preserves an empty stage value as `null` rather than zero. It checks `(district, assessment_unit, year)` for duplicates before update; the database unique constraint remains the final race-safe guard.

The form submits the `updated_at` value loaded with the record. The action re-reads the row and updates only when that timestamp still matches. A stale form receives a refresh/review message rather than overwriting newer data. This is optimistic concurrency protection, not record locking.

## Audit and provenance

The migration adds nullable `updated_by` referencing `auth.users`. A database trigger sets `updated_at` and records `auth.uid()` on every authenticated update. A privileged import without a user session retains an existing `updated_by` value. The migration replaces the broad table SELECT grant with an explicit public column grant that excludes `updated_by`, so administrator UUIDs are not exposed through normal public/authenticated reads. Trusted database administration can inspect that audit identity. This metadata describes the latest database correction; it does not replace or alter `source_year`, `source_document`, or `source_reference`.

Admin edits affect the database only. `data/raw/*`, `data/processed/groundwater_2024_normalized.csv`, and the official source PDF remain immutable evidence of the imported dataset. The database can intentionally differ from the normalized CSV after a documented correction. New records enter through the validated CSV workflow; there is no arbitrary record-creation form or delete control.

## Verification

CSV ingestion is documented in `docs/admin-csv-import.md`. The later migration
`20261015120000_add_admin_csv_import.sql` adds an admin-only INSERT policy,
transactional import functions and private import audit records. Existing
UPDATE/edit semantics remain unchanged; DELETE is still unavailable. New CSV
rows are inserted only after validation and confirmation, identical rows are
skipped, and conflicts use the existing editor for correction.

Static validation is provided by `node scripts/validate-admin-panel.mjs`. It verifies structure and important policy boundaries but cannot prove live authorization.

After applying the migration, use separate admin and normal test accounts to verify:

1. An unauthenticated browser is redirected from all `/admin` pages to `/admin/login`; a direct update action cannot save.
2. A normal authenticated account is denied `/admin`, `/admin/groundwater`, and an edit URL. From the browser Supabase client, an UPDATE of `groundwater_assessments` returns no modified row because RLS rejects it.
3. An admin account reaches all admin routes, can filter records, can save a valid correction, and sees the success message plus updated audit time.
4. A duplicate logical key, invalid number, blank required number and stale `updated_at` are rejected safely.
5. Public/anonymous groundwater reads still work, while public and normal authenticated INSERT/DELETE remain unavailable.

Use disposable or deliberately chosen test corrections and restore them through another audited admin correction if needed. Never embed credentials in scripts or documentation.
