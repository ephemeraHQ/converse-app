import { queryClient } from "@/queries/queryClient";
import { secureQueryPersister } from "@/utils/mmkv";
import { queryOptions, skipToken } from "@tanstack/react-query";
import { getCurrentSender } from "../multi-inbox/multi-inbox.store";
import { fetchJwt } from "./authentication.api";

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
    staleTime: Infinity,
    persister: secureQueryPersister,
  });
}

export async function ensureJwtQueryData() {
  return queryClient.ensureQueryData(getJwtQueryOptions());
}

export function refetchJwtQuery() {
  return queryClient.refetchQueries(getJwtQueryOptions());
}
