import { queryOptions, skipToken } from "@tanstack/react-query";
import { queryClient } from "@/queries/queryClient";
import { fetchJwt } from "./authentication.api";
import { getCurrentSender } from "./multi-inbox.store";

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
  });
}

export async function ensureJwtQueryData() {
  return queryClient.ensureQueryData(getJwtQueryOptions());
}

export function refetchJwtQuery() {
  return queryClient.refetchQueries(getJwtQueryOptions());
}
