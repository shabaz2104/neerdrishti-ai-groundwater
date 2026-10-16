import { getDistricts } from "@/lib/groundwater-queries.server";

import Explorer from "@/app/app/explorer/explorer";

export const dynamic = "force-dynamic";

export default async function ExplorerPage() {
  const districtResult = await getDistricts();
  const initialYear = 2024 as const;

  return (
    <Explorer
      initialDistricts={districtResult.data ?? []}
      initialDistrictsError={
        districtResult.error
          ? "Districts could not be loaded. Please refresh and try again."
          : undefined
      }
      initialYear={initialYear}
    />
  );
}
