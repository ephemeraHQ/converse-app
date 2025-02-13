import { getUserQueryKey } from "@/queries/QueryKeys";
import { queryClient } from "@/queries/queryClient";
import { Optional } from "@/types/general";
import { getUserByPrivyUserId, type IUser } from "@/utils/api/users";
import { updateObjectAndMethods } from "@/utils/update-object-and-methods";
import { queryOptions, useQuery } from "@tanstack/react-query";

export type UserQueryData = IUser;

type IGetUserArgs = {
  privyUserId: string;
};

type IGetUserArgsWithCaller = IGetUserArgs & { caller: string };

export const useUserQuery = (args: IGetUserArgsWithCaller) => {
  return useQuery(getUserQueryOptions(args));
};

export function getUserQueryOptions(
  args: Optional<IGetUserArgsWithCaller, "caller">
) {
  const { privyUserId, caller } = args;
  return queryOptions({
    meta: {
      caller,
    },
    queryKey: getUserQueryKey({ privyUserId }),
    queryFn: () => getUserByPrivyUserId({ privyUserId }),
    enabled: !!privyUserId,
  });
}

export const setUserQueryData = (
  args: IGetUserArgs & { user: UserQueryData }
) => {
  const { privyUserId, user } = args;
  queryClient.setQueryData(
    getUserQueryOptions({
      privyUserId,
    }).queryKey,
    user
  );
};

export function updateUserQueryData(
  args: IGetUserArgs & {
    userUpdate: Partial<UserQueryData>;
  }
) {
  const { userUpdate } = args;
  queryClient.setQueryData(
    getUserQueryOptions(args).queryKey,
    (previousUser) => {
      if (!previousUser) {
        return undefined;
      }
      return updateObjectAndMethods(previousUser, userUpdate);
    }
  );
}

export const getUserQueryData = (args: IGetUserArgs) => {
  return queryClient.getQueryData(getUserQueryOptions(args).queryKey);
};

export function getOrFetchUser(args: IGetUserArgsWithCaller) {
  return queryClient.ensureQueryData(getUserQueryOptions(args));
}

export function ensureUserQueryData(args: IGetUserArgsWithCaller) {
  return queryClient.ensureQueryData(getUserQueryOptions(args));
}

export function fetchUserQueryData(args: IGetUserArgsWithCaller) {
  return queryClient.fetchQuery(getUserQueryOptions(args));
}
