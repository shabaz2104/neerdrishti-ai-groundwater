begin;

-- The application only supports the verified Maharashtra 2024 dataset. Keep
-- numeric input finite in practice and prevent negative measurements at the
-- database boundary, including calls that bypass the application UI.
alter table public.groundwater_assessments
  add constraint groundwater_assessments_supported_domain_check check (
    year = 2024
    and source_year = 2024
    and state_code = 'MH'
    and source_serial_number between 1 and 2147483647
    and recharge between 0 and 1000000000000
    and extraction between 0 and 1000000000000
    and total_geographical_area between 0 and 1000000000000
    and recharge_worthy_area between 0 and 1000000000000
    and recharge_from_rainfall_monsoon between 0 and 1000000000000
    and recharge_from_other_sources_monsoon between 0 and 1000000000000
    and recharge_from_rainfall_non_monsoon between 0 and 1000000000000
    and recharge_from_other_sources_non_monsoon between 0 and 1000000000000
    and total_natural_discharges between 0 and 1000000000000
    and annual_extractable_groundwater_resource between 0 and 1000000000000
    and irrigation_use between 0 and 1000000000000
    and industrial_use between 0 and 1000000000000
    and domestic_use between 0 and 1000000000000
    and annual_gw_allocation_for_domestic_use_as_on_2025 between 0 and 1000000000000
    and net_groundwater_availability_for_future_use between 0 and 1000000000000
    and (stage_of_groundwater_extraction_percent is null
      or stage_of_groundwater_extraction_percent between 0 and 1000000000000)
  ) not valid;

alter table public.groundwater_assessments
  validate constraint groundwater_assessments_supported_domain_check;

create or replace function public.validate_groundwater_csv_rows(p_rows jsonb)
returns void language plpgsql security invoker set search_path = ''
as $$
declare
  v_item jsonb;
  v_values jsonb;
  v_field text;
begin
  if not coalesce(public.is_admin(), false) then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if jsonb_typeof(p_rows) is distinct from 'array' then
    raise exception 'Invalid CSV rows' using errcode = '22023';
  end if;
  if jsonb_array_length(p_rows) not between 1 and 1000 or octet_length(p_rows::text) > 2097152 then
    raise exception 'CSV row limit exceeded' using errcode = '22023';
  end if;
  for v_item in select value from jsonb_array_elements(p_rows) loop
    v_values := v_item->'values';
    if jsonb_typeof(v_item) is distinct from 'object'
      or jsonb_typeof(v_values) is distinct from 'object'
      or jsonb_typeof(v_item->'rowNumber') is distinct from 'number'
      or (v_item->>'rowNumber') !~ '^[0-9]+$'
      or (v_item->>'rowNumber')::integer not between 2 and 1001 then
      raise exception 'Invalid CSV row' using errcode = '22023';
    end if;
    if (select count(*) from jsonb_object_keys(v_values)) <> 24
      or not (v_values ?& array['district', 'assessment_unit', 'year', 'recharge', 'extraction', 'classification', 'state_code', 'district_code', 'assessment_unit_code', 'source_serial_number', 'total_geographical_area', 'recharge_worthy_area', 'recharge_from_rainfall_monsoon', 'recharge_from_other_sources_monsoon', 'recharge_from_rainfall_non_monsoon', 'recharge_from_other_sources_non_monsoon', 'total_natural_discharges', 'annual_extractable_groundwater_resource', 'irrigation_use', 'industrial_use', 'domestic_use', 'annual_gw_allocation_for_domestic_use_as_on_2025', 'net_groundwater_availability_for_future_use', 'stage_of_groundwater_extraction_percent']) then
      raise exception 'Invalid CSV contract' using errcode = '22023';
    end if;
    foreach v_field in array array['district', 'assessment_unit', 'classification', 'state_code', 'district_code', 'assessment_unit_code'] loop
      if jsonb_typeof(v_values->v_field) is distinct from 'string'
        or length(btrim(v_values->>v_field)) = 0
        or length(v_values->>v_field) > (case when v_field = 'assessment_unit' then 160 when v_field = 'district' then 120 else 64 end)
        or (v_values->>v_field) ~ '[[:cntrl:]]'
        or (v_values->>v_field) <> btrim(v_values->>v_field) then
        raise exception 'Invalid CSV identifier' using errcode = '22023';
      end if;
    end loop;
    if v_values->>'year' is distinct from '2024' or v_values->>'state_code' is distinct from 'MH'
      or v_values->>'classification' not in ('safe', 'semi_critical', 'critical', 'over_exploited', 'salinity') then
      raise exception 'Unsupported CSV year, state or classification' using errcode = '22023';
    end if;
    foreach v_field in array array['year', 'recharge', 'extraction', 'source_serial_number', 'total_geographical_area', 'recharge_worthy_area', 'recharge_from_rainfall_monsoon', 'recharge_from_other_sources_monsoon', 'recharge_from_rainfall_non_monsoon', 'recharge_from_other_sources_non_monsoon', 'total_natural_discharges', 'annual_extractable_groundwater_resource', 'irrigation_use', 'industrial_use', 'domestic_use', 'annual_gw_allocation_for_domestic_use_as_on_2025', 'net_groundwater_availability_for_future_use', 'stage_of_groundwater_extraction_percent'] loop
      if v_field = 'stage_of_groundwater_extraction_percent' and v_values->v_field = 'null'::jsonb then
        continue;
      end if;
      if jsonb_typeof(v_values->v_field) is distinct from 'string'
        or length(v_values->>v_field) > 64
        or (v_values->>v_field) !~ '^-?([0-9]+[.]?[0-9]*|[.][0-9]+)$' then
        raise exception 'Invalid CSV number' using errcode = '22023';
      end if;
      if (v_values->>v_field)::numeric < 0 or (v_values->>v_field)::numeric > 1000000000000 then
        raise exception 'CSV number outside supported range' using errcode = '22023';
      end if;
    end loop;
    if (v_values->>'source_serial_number') !~ '^[0-9]+$'
      or (v_values->>'source_serial_number')::numeric not between 1 and 2147483647 then
      raise exception 'Invalid CSV source serial number' using errcode = '22023';
    end if;
  end loop;
  if exists (
    select 1 from jsonb_array_elements(p_rows) item
    group by item->'values'->>'district', item->'values'->>'assessment_unit', item->'values'->>'year'
    having count(*) > 1
  ) or exists (
    select 1 from jsonb_array_elements(p_rows) item group by item->>'rowNumber' having count(*) > 1
  ) then
    raise exception 'Duplicate CSV row' using errcode = '22023';
  end if;
end;
$$;

revoke all on function public.validate_groundwater_csv_rows(jsonb) from public, anon;
grant execute on function public.validate_groundwater_csv_rows(jsonb) to authenticated;

commit;
