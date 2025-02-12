import { getUserQueryKey } from "@/queries/QueryKeys";
import { queryClient } from "@/queries/queryClient";
import { Optional } from "@/types/general";
import { getUser, type IUser } from "@/utils/api/users";
import { updateObjectAndMethods } from "@/utils/update-object-and-methods";
import { queryOptions, useQuery } from "@tanstack/react-query";

export type UserQueryData = IUser;

type IGetUserArgs = {
  address: string;
};

type IGetUserArgsWithCaller = IGetUserArgs & { caller: string };

export const useUserQuery = (args: IGetUserArgsWithCaller) => {
  return useQuery(getUserQueryOptions(args));
};

export function getUserQueryOptions(
  args: Optional<IGetUserArgsWithCaller, "caller">
) {
  const { address, caller } = args;
  const enabled = !!address;
  return queryOptions({
    meta: {
      caller,
    },
    queryKey: getUserQueryKey({ privyId: address }),
    queryFn: () => getUser({ address }),
    enabled,
  });
}

export const setUserQueryData = (
  args: IGetUserArgs & { user: UserQueryData }
) => {
  const { address, user } = args;
  queryClient.setQueryData(
    getUserQueryOptions({
      address,
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
