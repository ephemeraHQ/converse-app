import { queryOptions, skipToken } from "@tanstack/react-query";
import { CreateUserResponse } from "@features/authentication/authentication.api";
import { getJwtQueryData } from "../authentication/jwt.query";
import { queryClient } from "@/queries/queryClient";
import { reactQueryPersister } from "@/utils/mmkv";
import { fetchCurrentUser } from "./current-user-api";

const currentUserQueryKey = () => ["current-user"] as const;

function getCurrentUserQueryOptions() {
  const hasAuthenticated = getJwtQueryData();
  const enabled = !!hasAuthenticated;
  return queryOptions({
    enabled,
    queryKey: currentUserQueryKey(),
    queryFn: enabled ? () => fetchCurrentUser() : skipToken,
    persister: reactQueryPersister,
    refetchOnWindowFocus: true,
  });
}

export const setCurrentUserQueryData = (user: CreateUserResponse) => {
  return queryClient.setQueryData(getCurrentUserQueryOptions().queryKey, user);
};

export const invalidateCurrentUserQuery = () => {
  return queryClient.invalidateQueries({
    queryKey: getCurrentUserQueryOptions().queryKey,
  });
};

export const cancelCurrentUserQuery = () => {
  return queryClient.cancelQueries({
    queryKey: getCurrentUserQueryOptions().queryKey,
  });
};

export const getCurrentUserQueryData = () => {
  return queryClient.getQueryData(getCurrentUserQueryOptions().queryKey);
};
