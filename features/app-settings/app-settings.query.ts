import { queryOptions, useQuery } from "@tanstack/react-query";
import { getAppConfig } from "@/features/app-settings/app-settings.api";

export function getAppSettingsQueryOptions() {
  return queryOptions({
    queryKey: ["app-settings"],
    queryFn: () => getAppConfig(),
  });
}

export function useAppSettingsQuery() {
  return useQuery(getAppSettingsQueryOptions());
}
