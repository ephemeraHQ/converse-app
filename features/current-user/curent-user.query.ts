import { queryOptions, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/queries/queryClient";
import { fetchCurrentUser, ICurrentUser } from "./current-user-api";

const currentUserQueryKey = () => ["current-user"] as const;

export function getCurrentUserQueryOptions() {
  return queryOptions({
    queryKey: currentUserQueryKey(),
    queryFn: fetchCurrentUser,
    // persister: reactQueryPersister, // Remove tmp until we are solid with our persister
    refetchOnWindowFocus: true,
  });
}

export function useCurrentUserQuery() {
  return useQuery(getCurrentUserQueryOptions());
}

export function setCurrentUserQueryData(args: { user: ICurrentUser }) {
  const { user } = args;
  return queryClient.setQueryData(getCurrentUserQueryOptions().queryKey, user);
}

export function invalidateCurrentUserQuery() {
  return queryClient.invalidateQueries({
    queryKey: getCurrentUserQueryOptions().queryKey,
  });
}

export function cancelCurrentUserQuery() {
  return queryClient.cancelQueries({
    queryKey: getCurrentUserQueryOptions().queryKey,
  });
}

export function getCurrentUserQueryData() {
  return queryClient.getQueryData(getCurrentUserQueryOptions().queryKey);
}

export function ensureCurrentUserQueryData() {
  return queryClient.ensureQueryData(getCurrentUserQueryOptions());
}
