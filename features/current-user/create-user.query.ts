import {
  queryOptions,
  skipToken,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createUser,
  CreateUserResponse,
  fetchJwt,
} from "@features/authentication/authentication.api";
import {
  IConvosProfileForInboxUpdate,
  invalidateProfileQuery,
  setProfileQueryData,
} from "@features/profiles/profiles.query";
import { IConvosProfileForInbox } from "@features/profiles/profiles.api";
import {
  ensureJwtQueryData,
  getJwtQueryData,
} from "../authentication/jwt.query";
import { queryClient } from "@/queries/queryClient";
import { reactQueryPersister } from "@/utils/mmkv";
import { fetchCurrentUser } from "./current-user-api";
import { buildDeviceMetadata } from "@/utils/device-metadata";

type ICreateUserArgs = {
  privyUserId: string;
  smartContractWalletAddress: string;
  inboxId: string;
  profile: {
    name: string;
    avatar?: string;
  };
};

const userQueryKey = () => ["user"];

function getCurrentUserQueryOptions() {
  const hasAuthenticated = getJwtQueryData();
  const enabled = !!hasAuthenticated;
  return queryOptions({
    enabled,
    queryKey: userQueryKey(),
    queryFn: enabled ? () => fetchCurrentUser() : skipToken,
    persister: reactQueryPersister,
    refetchOnWindowFocus: true,
  });
}

export const setCurrentUserData = (user: CreateUserResponse) => {
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

const buildOptimisticUser = (args: ICreateUserArgs): CreateUserResponse => {
  const device = buildDeviceMetadata();
  return {
    id: "123",
    privyUserId: args.privyUserId,
    device: {
      ...device,
      id: "123",
    },
    identity: {
      id: "123",
      privyAddress: args.smartContractWalletAddress,
      xmtpId: args.inboxId,
    },
    profile: {
      id: "123",
      name: args.profile.name,
      description: null,
    },
  };
};

/**
 * Hook to create a new user and handle related state updates
 *
 * This mutation:
 * 1. Creates a user via the API with provided profile info
 * 2. Optimistically updates the users query cache
 * 3. Fetches a new JWT token after user creation
 * 4. Follows React Query best practices for mutations
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: ICreateUserArgs) => {
      const user = await createUser(args);
      await ensureJwtQueryData();
      return user;
    },
    onMutate: async (args: ICreateUserArgs) => {
      await cancelCurrentUserQuery();

      const optimisticUser = buildOptimisticUser(args);
      queryClient.setQueryData(userQueryKey(), optimisticUser);

      const optimisticProfile: IConvosProfileForInboxUpdate = {
        id: optimisticUser.profile.id,
        name: optimisticUser.profile.name,
        description: optimisticUser.profile.description,
      };

      setProfileQueryData({
        xmtpId: args.inboxId,
        data: optimisticProfile,
      });

      return {
        optimisticUser,
        optimisticProfile,
      };
    },
    onSuccess: (createdUser, variables, { optimisticProfile }) => {
      setCurrentUserData(createdUser);
      setProfileQueryData({
        xmtpId: variables.inboxId,
        data: optimisticProfile,
      });
      invalidateCurrentUserQuery();
      invalidateProfileQuery({ xmtpId: variables.inboxId });
    },
  });
}
