import { useMutation } from "@tanstack/react-query";
import { InboxId } from "@xmtp/react-native-sdk";
import { claimProfile, updateProfile } from "../profiles.api";

/**
 * Hook for saving profile information using React Query mutation
 * Handles the API call, error handling, and cache invalidation
 */

type IUpdateProfileArgs = {
  profile: {
    id: string;
    name: string;
    description: string;
    avatar: string;
  };
  inboxId: InboxId;
};

export function useSaveProfileMutation() {
  // Kept useCreateOrUpdateProfileInfo.ts for now to get inspiration from it maybe.
  // But let's delete useCreateOrUpdateProfileInfo.ts once we're done with that hook

  return useMutation({
    mutationFn: async (args: IUpdateProfileArgs) => {
      const { profile, inboxId } = args;

      // TODO: Use new backend API to update profile with inbox Id? Or maybe we pass the Profile id directly?
      await claimProfile({
        profile: {
          name: profile.name,
          description: profile.description,
          username: profile.name,
          // TODO
          // avatar:
        },
      });

      updateProfile({
        id: profile.id,
        updates: {
          name: profile.name,
          description: profile.description,
          // TODO
          // avatar:
        },
      });
    },

    onMutate: async (args: IUpdateProfileArgs) => {
      const { profile, inboxId } = args;
    },
    // TODO: Normally we don't to refetch or invalidate, but only if there's an error
    // But let's wait to see what the new backend returns so we can optimistic update
    onSuccess: () => {},
  });
}
