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
      ? async ({ signal }) => {
          const { token } = await fetchJwt({ signal });
          return token;
        }
      : skipToken,
    staleTime: Infinity,
  });
}

export async function ensureJwtQueryData() {
  return queryClient.ensureQueryData(getJwtQueryOptions());
}

export async function refreshAndGetNewJwtQuery() {
  // Force invalidate the query to ensure we get fresh data
  await queryClient.invalidateQueries(getJwtQueryOptions());

  // Fetch the new token
  const newToken = await queryClient.fetchQuery(getJwtQueryOptions());

  return newToken;
}
