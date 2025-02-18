import { queryOptions } from "@tanstack/react-query";
import { secureQueryPersister } from "@/utils/mmkv";
import { queryClient } from "@/queries/queryClient";
import { fetchJwt } from "./authentication.api";

export function getJwtQueryOptions() {
  return queryOptions({
    queryKey: ["jwt"],
    queryFn: async () => {
      const jwt = await fetchJwt();
      return jwt;
    },
    staleTime: Infinity,
    persister: secureQueryPersister,
  });
}

export async function ensureJwtQueryData() {
  return queryClient.ensureQueryData(getJwtQueryOptions());
}

export function getJwtQueryData() {
  return queryClient.getQueryData(getJwtQueryOptions().queryKey);
}
