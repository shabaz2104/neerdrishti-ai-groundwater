begin;

create extension if not exists pgcrypto;

create table public.groundwater_assessments (
  id uuid primary key default gen_random_uuid(),

  -- Canonical groundwater record fields.
  district text not null,
  assessment_unit text not null,
  year integer not null,
  recharge numeric not null,
  extraction numeric not null,
  classification text not null,

  -- Source identifiers and additional normalized fields.
  state_code text not null,
  district_code text not null,
  assessment_unit_code text not null,
  source_serial_number integer not null,
  total_geographical_area numeric not null,
  recharge_worthy_area numeric not null,
  recharge_from_rainfall_monsoon numeric not null,
  recharge_from_other_sources_monsoon numeric not null,
  recharge_from_rainfall_non_monsoon numeric not null,
  recharge_from_other_sources_non_monsoon numeric not null,
  total_natural_discharges numeric not null,
  annual_extractable_groundwater_resource numeric not null,
  irrigation_use numeric not null,
  industrial_use numeric not null,
  domestic_use numeric not null,
  annual_gw_allocation_for_domestic_use_as_on_2025 numeric not null,
  net_groundwater_availability_for_future_use numeric not null,
  stage_of_groundwater_extraction_percent numeric,

  -- Row-level source traceability and lifecycle metadata.
  source_year integer not null,
  source_document text not null,
  source_reference text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint groundwater_assessments_district_assessment_unit_year_key
    unique (district, assessment_unit, year),
  constraint groundwater_assessments_classification_check
    check (classification in (
      'critical',
      'over_exploited',
      'safe',
      'salinity',
      'semi_critical'
    ))
);

comment on table public.groundwater_assessments is
  'Structured groundwater assessment records prepared from the normalized Maharashtra 2024 dataset.';

alter table public.groundwater_assessments enable row level security;

grant select on table public.groundwater_assessments to anon, authenticated;

create policy groundwater_assessments_public_read
  on public.groundwater_assessments
  for select
  to anon, authenticated
  using (true);

-- No INSERT, UPDATE, or DELETE policy is created for public roles.

commit;
