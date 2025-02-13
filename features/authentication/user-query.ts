import { getCurrentUserQueryKey } from "@/queries/QueryKeys";
import { queryClient } from "@/queries/queryClient";
import { IGetCurrentUserResponse, getCurrentUser } from "@/utils/api/users";
import { updateObjectAndMethods } from "@/utils/update-object-and-methods";
import { queryOptions, useQuery } from "@tanstack/react-query";

export type UserQueryData = IGetCurrentUserResponse;

type IGetCurrentUserArgs = {
  caller?: string;
};

export const useCurrentUserQuery = (args: IGetCurrentUserArgs = {}) => {
  return useQuery(getCurrentUserQueryOptions(args));
};

export function getCurrentUserQueryOptions(args: IGetCurrentUserArgs = {}) {
  const { caller } = args;
  return queryOptions({
    meta: {
      caller,
    },
    queryKey: getCurrentUserQueryKey(),
    queryFn: getCurrentUser,
  });
}

export const setCurrentUserQueryData = (args: { user: UserQueryData }) => {
  const { user } = args;
  queryClient.setQueryData(getCurrentUserQueryOptions().queryKey, user);
};

export function updateCurrentUserQueryData(args: {
  userUpdate: Partial<UserQueryData>;
}) {
  const { userUpdate } = args;
  queryClient.setQueryData(
    getCurrentUserQueryOptions().queryKey,
    (previousUser) => {
      if (!previousUser) {
        return undefined;
      }
      return updateObjectAndMethods(previousUser, userUpdate);
    }
  );
}

export const getCurrentUserQueryData = () => {
  return queryClient.getQueryData(getCurrentUserQueryOptions().queryKey);
};

export function getOrFetchCurrentUser(args: IGetCurrentUserArgs = {}) {
  return queryClient.ensureQueryData(getCurrentUserQueryOptions(args));
}

export function ensureCurrentUserQueryData(args: IGetCurrentUserArgs = {}) {
  return queryClient.ensureQueryData(getCurrentUserQueryOptions(args));
}

export function fetchCurrentUserQueryData(args: IGetCurrentUserArgs = {}) {
  return queryClient.fetchQuery(getCurrentUserQueryOptions(args));
}
