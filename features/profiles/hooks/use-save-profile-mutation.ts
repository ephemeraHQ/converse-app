/**
 *
 * MIGHT NEED TO DELETE AND USE THE SAME HOOK AS THE ONBOARDING ONE.
 *
 */
import { useCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import { refetchInboxProfileSocialsQuery } from "@/queries/useInboxProfileSocialsQuery";
import { useMutation } from "@tanstack/react-query";
import { InboxId } from "@xmtp/react-native-sdk";
import { claimProfile } from "../profiles.api";

/**
 * Hook for saving profile information using React Query mutation
 * Handles the API call, error handling, and cache invalidation
 */
export function useSaveProfileMutation() {
  const userAddress = useCurrentAccount() as string;

  return useMutation({
    mutationFn: async (args: { profile: ProfileType; inboxId: InboxId }) => {
      const { profile } = args;

      // TODO: Use new backend API to update profile with inbox Id? Or maybe we pass the Profile id directly?

      await claimProfile({
        profile,
      });
    },

    onMutate: async (args: { profile: ProfileType; inboxId: InboxId }) => {
      const { profile } = args;
    },
    // TODO: Normally we don't to refetch or invalidate, but only if there's an error
    // But let's wait to see what the new backend returns so we can optimistic update
    onSuccess: () => {
      refetchInboxProfileSocialsQuery({
        inboxId: userAddress,
      });
    },
  });
}
