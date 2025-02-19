import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { secureQueryPersister } from "@/utils/mmkv";
import { queryClient } from "@/queries/queryClient";
import { fetchJwt } from "./authentication.api";
import { getCurrentSender } from "../multi-inbox/multi-inbox.store";
import { DateUtils } from "@/utils/time.utils";

export function getJwtQueryOptions() {
  const currentSender = getCurrentSender();
  const enabled = !!currentSender?.ethereumAddress && !!currentSender.inboxId;
  return queryOptions({
    enabled,
    queryKey: ["jwt"],
    queryFn: enabled
      ? async () => {
          const { token } = await fetchJwt();
          return token;
        }
      : skipToken,
    staleTime: DateUtils.days.toMilliseconds(30),
    persister: secureQueryPersister,
  });
}

export function useJwtQuery() {
  return useQuery(getJwtQueryOptions());
}

export async function fetchJwtQueryData() {
  return queryClient.fetchQuery(getJwtQueryOptions());
}

export async function ensureJwtQueryData() {
  return queryClient.ensureQueryData(getJwtQueryOptions());
}

export function getJwtQueryData() {
  return queryClient.getQueryData(getJwtQueryOptions().queryKey);
}

export async function invalidateJwtQueryData() {
  return queryClient.invalidateQueries(getJwtQueryOptions());
}

export function setJwtQueryData(data: string) {
  return queryClient.setQueryData(getJwtQueryOptions().queryKey, data);
}

// react-query doesn't support setting to undefined, so we use this falsy string instead
const EmptyJwt = "" as const;
export function clearJwtQueryData() {
  setJwtQueryData(EmptyJwt);
}
