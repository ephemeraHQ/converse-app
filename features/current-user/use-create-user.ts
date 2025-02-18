import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createUser,
  CreateUserResponse,
} from "@features/authentication/authentication.api";
import {
  IConvosProfileForInboxUpdate,
  removeProfileQueryData,
  setProfileQueryData,
} from "@features/profiles/profiles.query";
import { ensureJwtQueryData } from "../authentication/jwt.query";
import { buildDeviceMetadata } from "@/utils/device-metadata";
import { useLogout } from "@/utils/logout";
import {
  cancelCurrentUserQuery,
  setCurrentUserQueryData,
} from "./curent-user.query";

type ICreateUserArgs = {
  privyUserId: string;
  smartContractWalletAddress: string;
  inboxId: string;
  profile: {
    name: string;
    avatar?: string;
  };
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
  const { logout } = useLogout();

  return useMutation({
    mutationFn: async (args: ICreateUserArgs) => {
      const user = await createUser(args);
      await ensureJwtQueryData();
      return user;
    },
    onMutate: async (args: ICreateUserArgs) => {
      await cancelCurrentUserQuery();

      const optimisticUser = buildOptimisticUser(args);
      setCurrentUserQueryData(optimisticUser);

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
      setCurrentUserQueryData(createdUser);
      setProfileQueryData({
        xmtpId: variables.inboxId,
        data: optimisticProfile,
      });
    },
    onError: (_error, variables) => {
      removeProfileQueryData({ xmtpId: variables.inboxId });
      logout();
    },
  });
}
