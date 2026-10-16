begin;

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),

  constraint user_roles_pkey primary key (user_id, role),
  constraint user_roles_role_check check (role in ('admin'))
);

comment on table public.user_roles is
  'Server-verifiable application roles for authenticated NeerDrishti users.';

alter table public.user_roles enable row level security;

grant select on table public.user_roles to authenticated;

create policy user_roles_read_own
  on public.user_roles
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.groundwater_assessments
  add column updated_by uuid references auth.users(id) on delete set null;

comment on column public.groundwater_assessments.updated_by is
  'Authenticated administrator responsible for the latest database correction; source provenance remains unchanged.';

-- Keep the audit identity out of the public read surface. Existing application
-- queries name their columns explicitly and continue to use the public RLS row
-- policy from the base migration.
revoke select on table public.groundwater_assessments from anon, authenticated;
grant select (
  id,
  district,
  assessment_unit,
  year,
  recharge,
  extraction,
  classification,
  state_code,
  district_code,
  assessment_unit_code,
  source_serial_number,
  total_geographical_area,
  recharge_worthy_area,
  recharge_from_rainfall_monsoon,
  recharge_from_other_sources_monsoon,
  recharge_from_rainfall_non_monsoon,
  recharge_from_other_sources_non_monsoon,
  total_natural_discharges,
  annual_extractable_groundwater_resource,
  irrigation_use,
  industrial_use,
  domestic_use,
  annual_gw_allocation_for_domestic_use_as_on_2025,
  net_groundwater_availability_for_future_use,
  stage_of_groundwater_extraction_percent,
  source_year,
  source_document,
  source_reference,
  created_at,
  updated_at
) on table public.groundwater_assessments to anon, authenticated;

create function public.set_groundwater_admin_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  new.updated_by = coalesce((select auth.uid()), old.updated_by);
  return new;
end;
$$;

revoke all on function public.set_groundwater_admin_audit() from public;

create trigger groundwater_assessments_set_admin_audit
before update on public.groundwater_assessments
for each row execute function public.set_groundwater_admin_audit();

revoke insert, update, delete on table public.groundwater_assessments
  from anon, authenticated;

grant update (
  district,
  assessment_unit,
  year,
  recharge,
  extraction,
  classification,
  total_geographical_area,
  recharge_worthy_area,
  recharge_from_rainfall_monsoon,
  recharge_from_other_sources_monsoon,
  recharge_from_rainfall_non_monsoon,
  recharge_from_other_sources_non_monsoon,
  total_natural_discharges,
  annual_extractable_groundwater_resource,
  irrigation_use,
  industrial_use,
  domestic_use,
  annual_gw_allocation_for_domestic_use_as_on_2025,
  net_groundwater_availability_for_future_use,
  stage_of_groundwater_extraction_percent
) on table public.groundwater_assessments to authenticated;

create policy groundwater_assessments_admin_update
  on public.groundwater_assessments
  for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

commit;
