import { setCurrentUserQueryData } from "@/features/current-user/curent-user.query";
import { setProfileQueryData } from "@/features/profiles/profiles.query";
import { buildDeviceMetadata } from "@/utils/device-metadata";
import {
  CreateUserResponse,
  createUser,
} from "@features/authentication/authentication.api";
import { useMutation } from "@tanstack/react-query";

type ICreateUserArgs = {
  privyUserId: string;
  smartContractWalletAddress: string;
  inboxId: string;
  profile: {
    name: string;
    username: string;
    avatar?: string;
    description?: string;
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
      username: args.profile.username,
      description: args.profile.description ?? null,
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
  // const { logout } = useLogout();

  return useMutation({
    mutationFn: async (args: ICreateUserArgs) => {
      return createUser(args);
    },
    // onMutate: async (args: ICreateUserArgs) => {
    //   await cancelCurrentUserQuery();

    //   const optimisticUser = buildOptimisticUser(args);
    //   setCurrentUserQueryData(optimisticUser);

    //   const optimisticProfile: IConvosProfileForInboxUpdate = {
    //     id: optimisticUser.profile.id,
    //     name: optimisticUser.profile.name,
    //     description: optimisticUser.profile.description,
    //   };

    //   setProfileQueryData({
    //     xmtpId: args.inboxId,
    //     data: optimisticProfile,
    //   });

    //   return {
    //     optimisticUser,
    //     optimisticProfile,
    //   };
    // },
    // onSuccess: (createdUser, variables, { optimisticProfile }) => {
    //   setCurrentUserQueryData(createdUser);
    //   setProfileQueryData({
    //     xmtpId: variables.inboxId,
    //     data: optimisticProfile,
    //   });
    // },
    // onError: (_error, variables) => {
    //   removeProfileQueryData({ xmtpId: variables.inboxId });
    //   logout();
    // },

    onSuccess: (data) => {
      setCurrentUserQueryData({
        user: {
          id: data.id,
          identities: [data.identity],
        },
      });
      setProfileQueryData({
        xmtpId: data.identity.xmtpId,
        data: {
          id: data.profile.id,
          name: data.profile.name,
          username: data.profile.username,
          description: data.profile.description ?? null,
        },
      });
    },
  });
}
