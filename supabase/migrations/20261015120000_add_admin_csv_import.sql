begin;

create table public.dataset_imports (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid references auth.users(id) on delete set null,
  original_file_name text not null check (char_length(original_file_name) between 1 and 160),
  file_sha256 text not null check (file_sha256 ~ '^[0-9a-f]{64}$'),
  uploaded_at timestamptz not null default now(),
  status text not null check (status in ('completed', 'completed_with_conflicts')),
  total_rows integer not null check (total_rows between 1 and 1000),
  new_rows integer not null check (new_rows >= 0),
  inserted_rows integer not null check (inserted_rows >= 0),
  unchanged_rows integer not null check (unchanged_rows >= 0),
  conflict_rows integer not null check (conflict_rows >= 0),
  invalid_rows integer not null default 0 check (invalid_rows = 0),
  check (new_rows = inserted_rows),
  check (total_rows = inserted_rows + unchanged_rows + conflict_rows)
);
alter table public.dataset_imports enable row level security;
revoke all on table public.dataset_imports from anon, authenticated;
grant select on table public.dataset_imports to authenticated;
grant insert (uploaded_by, original_file_name, file_sha256, status, total_rows,
  new_rows, inserted_rows, unchanged_rows, conflict_rows, invalid_rows)
  on table public.dataset_imports to authenticated;
create policy dataset_imports_admin_read on public.dataset_imports
  for select to authenticated using ((select public.is_admin()));
create policy dataset_imports_admin_insert on public.dataset_imports
  for insert to authenticated with check (
    (select public.is_admin()) and uploaded_by = (select auth.uid())
  );

grant insert (
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
  source_year, source_document, source_reference
) on table public.groundwater_assessments to authenticated;
create policy groundwater_assessments_admin_insert on public.groundwater_assessments
  for insert to authenticated with check (
    (select public.is_admin()) and year = 2024 and source_year = 2024 and state_code = 'MH'
  );

-- Every callable database entry verifies the current role; none uses a privileged key.
create function public.validate_groundwater_csv_rows(p_rows jsonb)
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

create function public.preview_groundwater_csv(p_rows jsonb)
returns jsonb language plpgsql security invoker set search_path = ''
as $$
declare
  v_item jsonb;
  v_record public.groundwater_assessments;
  v_existing jsonb;
  v_expected jsonb;
  v_status text;
  v_results jsonb := '[]'::jsonb;
begin
  if not coalesce(public.is_admin(), false) then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  perform public.validate_groundwater_csv_rows(p_rows);
  for v_item in select value from jsonb_array_elements(p_rows) loop
    v_record := jsonb_populate_record(null::public.groundwater_assessments, v_item->'values');
    v_expected := to_jsonb(v_record) - array['id','source_year','source_document','source_reference','created_at','updated_at','updated_by'];
    select jsonb_build_object(
        'district', g.district,
        'assessment_unit', g.assessment_unit,
        'year', g.year,
        'recharge', g.recharge,
        'extraction', g.extraction,
        'classification', g.classification,
        'state_code', g.state_code,
        'district_code', g.district_code,
        'assessment_unit_code', g.assessment_unit_code,
        'source_serial_number', g.source_serial_number,
        'total_geographical_area', g.total_geographical_area,
        'recharge_worthy_area', g.recharge_worthy_area,
        'recharge_from_rainfall_monsoon', g.recharge_from_rainfall_monsoon,
        'recharge_from_other_sources_monsoon', g.recharge_from_other_sources_monsoon,
        'recharge_from_rainfall_non_monsoon', g.recharge_from_rainfall_non_monsoon,
        'recharge_from_other_sources_non_monsoon', g.recharge_from_other_sources_non_monsoon,
        'total_natural_discharges', g.total_natural_discharges,
        'annual_extractable_groundwater_resource', g.annual_extractable_groundwater_resource,
        'irrigation_use', g.irrigation_use,
        'industrial_use', g.industrial_use,
        'domestic_use', g.domestic_use,
        'annual_gw_allocation_for_domestic_use_as_on_2025', g.annual_gw_allocation_for_domestic_use_as_on_2025,
        'net_groundwater_availability_for_future_use', g.net_groundwater_availability_for_future_use,
        'stage_of_groundwater_extraction_percent', g.stage_of_groundwater_extraction_percent
      ) into v_existing
      from public.groundwater_assessments g
      where g.district = v_record.district and g.assessment_unit = v_record.assessment_unit and g.year = v_record.year;
    v_status := case when not found then 'NEW' when v_existing = v_expected then 'UNCHANGED' else 'CONFLICT' end;
    v_results := v_results || jsonb_build_array(jsonb_build_object(
      'rowNumber', (v_item->>'rowNumber')::integer, 'district', v_record.district,
      'assessmentUnit', v_record.assessment_unit, 'status', v_status
    ));
  end loop;
  return v_results;
end;
$$;

create function public.import_groundwater_csv(p_rows jsonb, p_file_name text, p_file_sha256 text)
returns jsonb language plpgsql security invoker set search_path = ''
as $$
declare
  v_item jsonb;
  v_record public.groundwater_assessments;
  v_existing jsonb;
  v_expected jsonb;
  v_inserted_id uuid;
  v_import_id uuid;
  v_inserted integer := 0;
  v_unchanged integer := 0;
  v_conflicts integer := 0;
  v_status text;
  v_results jsonb := '[]'::jsonb;
begin
  if not coalesce(public.is_admin(), false) then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  perform public.validate_groundwater_csv_rows(p_rows);
  if p_file_name is null or char_length(p_file_name) not between 1 and 160
    or p_file_name ~ '[[:cntrl:]]' or lower(p_file_name) not like '%.csv'
    or p_file_sha256 is null or p_file_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid CSV metadata' using errcode = '22023';
  end if;
  -- Sorted keys avoid lock-order inversions between simultaneous imports.
  -- ON CONFLICT never updates a groundwater record.
  for v_item in select value from jsonb_array_elements(p_rows)
    order by value->'values'->>'district', value->'values'->>'assessment_unit' loop
    v_record := jsonb_populate_record(null::public.groundwater_assessments, v_item->'values');
    v_expected := to_jsonb(v_record) - array['id','source_year','source_document','source_reference','created_at','updated_at','updated_by'];
    v_inserted_id := null;
    insert into public.groundwater_assessments (
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
        source_year, source_document, source_reference
      ) values (
        v_record.district,
        v_record.assessment_unit,
        v_record.year,
        v_record.recharge,
        v_record.extraction,
        v_record.classification,
        v_record.state_code,
        v_record.district_code,
        v_record.assessment_unit_code,
        v_record.source_serial_number,
        v_record.total_geographical_area,
        v_record.recharge_worthy_area,
        v_record.recharge_from_rainfall_monsoon,
        v_record.recharge_from_other_sources_monsoon,
        v_record.recharge_from_rainfall_non_monsoon,
        v_record.recharge_from_other_sources_non_monsoon,
        v_record.total_natural_discharges,
        v_record.annual_extractable_groundwater_resource,
        v_record.irrigation_use,
        v_record.industrial_use,
        v_record.domestic_use,
        v_record.annual_gw_allocation_for_domestic_use_as_on_2025,
        v_record.net_groundwater_availability_for_future_use,
        v_record.stage_of_groundwater_extraction_percent,
        2024, 'Administrator CSV upload (unverified source)',
        'CSV SHA-256: ' || p_file_sha256 || '; CSV row: ' || (v_item->>'rowNumber')
      )
      on conflict (district, assessment_unit, year) do nothing
      returning id into v_inserted_id;
    if v_inserted_id is not null then
      v_inserted := v_inserted + 1;
      v_status := 'NEW';
    else
      select jsonb_build_object(
        'district', g.district,
        'assessment_unit', g.assessment_unit,
        'year', g.year,
        'recharge', g.recharge,
        'extraction', g.extraction,
        'classification', g.classification,
        'state_code', g.state_code,
        'district_code', g.district_code,
        'assessment_unit_code', g.assessment_unit_code,
        'source_serial_number', g.source_serial_number,
        'total_geographical_area', g.total_geographical_area,
        'recharge_worthy_area', g.recharge_worthy_area,
        'recharge_from_rainfall_monsoon', g.recharge_from_rainfall_monsoon,
        'recharge_from_other_sources_monsoon', g.recharge_from_other_sources_monsoon,
        'recharge_from_rainfall_non_monsoon', g.recharge_from_rainfall_non_monsoon,
        'recharge_from_other_sources_non_monsoon', g.recharge_from_other_sources_non_monsoon,
        'total_natural_discharges', g.total_natural_discharges,
        'annual_extractable_groundwater_resource', g.annual_extractable_groundwater_resource,
        'irrigation_use', g.irrigation_use,
        'industrial_use', g.industrial_use,
        'domestic_use', g.domestic_use,
        'annual_gw_allocation_for_domestic_use_as_on_2025', g.annual_gw_allocation_for_domestic_use_as_on_2025,
        'net_groundwater_availability_for_future_use', g.net_groundwater_availability_for_future_use,
        'stage_of_groundwater_extraction_percent', g.stage_of_groundwater_extraction_percent
      ) into v_existing
        from public.groundwater_assessments g
        where g.district = v_record.district and g.assessment_unit = v_record.assessment_unit and g.year = v_record.year
        for share of g;
      if not found then
        raise exception 'Record changed during import; retry validation' using errcode = '40001';
      end if;
      if v_existing = v_expected then
        v_unchanged := v_unchanged + 1;
        v_status := 'UNCHANGED';
      else
        v_conflicts := v_conflicts + 1;
        v_status := 'CONFLICT';
      end if;
    end if;
    v_results := v_results || jsonb_build_array(jsonb_build_object(
      'rowNumber', (v_item->>'rowNumber')::integer, 'district', v_record.district,
      'assessmentUnit', v_record.assessment_unit, 'status', v_status
    ));
  end loop;

  insert into public.dataset_imports (
    uploaded_by, original_file_name, file_sha256, status, total_rows,
    new_rows, inserted_rows, unchanged_rows, conflict_rows, invalid_rows
  ) values (
    (select auth.uid()), p_file_name, p_file_sha256,
    case when v_conflicts > 0 then 'completed_with_conflicts' else 'completed' end,
    jsonb_array_length(p_rows), v_inserted, v_inserted, v_unchanged, v_conflicts, 0
  ) returning id into v_import_id;
  return jsonb_build_object('importId', v_import_id, 'totalRows', jsonb_array_length(p_rows),
    'newRows', v_inserted, 'insertedRows', v_inserted, 'unchangedRows', v_unchanged,
    'conflictRows', v_conflicts, 'invalidRows', 0, 'rows', v_results);
end;
$$;

revoke all on function public.validate_groundwater_csv_rows(jsonb) from public, anon;
revoke all on function public.preview_groundwater_csv(jsonb) from public, anon;
revoke all on function public.import_groundwater_csv(jsonb, text, text) from public, anon;
grant execute on function public.validate_groundwater_csv_rows(jsonb) to authenticated;
grant execute on function public.preview_groundwater_csv(jsonb) to authenticated;
grant execute on function public.import_groundwater_csv(jsonb, text, text) to authenticated;

commit;
