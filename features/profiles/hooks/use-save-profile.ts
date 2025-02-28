import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveProfileAsync } from "@/features/profiles/profiles.api";
import {
  type IConvosProfileForInbox,
  type ProfileInput
} from "@/features/profiles/profile.types";
import { 
  setProfileQueryData, 
  getProfileQueryData,
  invalidateProfileQuery
} from "@/features/profiles/profiles.query";
import { logger } from "@/utils/logger";

type SaveProfileArgs = {
  profile: ProfileInput;
  inboxId: string;
};

/**
 * Hook for saving profile data using React Query's useMutation
 * with optimistic updates for a better user experience
 * 
 * @returns An object containing the save function and mutation state
 */
export function useSaveProfile() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (args: SaveProfileArgs) => {
      const currentProfile = getProfileQueryData({ 
        xmtpId: args.inboxId 
      }) as IConvosProfileForInbox | undefined;
      
      logger.debug("[useSaveProfile] Starting mutation", {
        inboxId: args.inboxId,
        hasCurrentProfile: !!currentProfile,
        currentProfile: currentProfile ? JSON.stringify(currentProfile) : null,
        newProfile: JSON.stringify(args.profile)
      });
      
      // IMPORTANT: Make sure xmtpId is set correctly
      const profileWithXmtpId = {
        ...args.profile,
        xmtpId: args.inboxId,
      };
      
      logger.debug("[useSaveProfile] Sending profile update", { 
        profile: JSON.stringify(profileWithXmtpId)
      });
      
      return saveProfileAsync({
        profile: profileWithXmtpId,
        inboxId: args.inboxId,
      });
    },
    onMutate: async (args) => {
      // Capture the previous profile data for rollback
      const previousProfile = getProfileQueryData({ 
        xmtpId: args.inboxId 
      }) as IConvosProfileForInbox | undefined;

      // Optimistically update the profile in the cache
      setProfileQueryData({
        xmtpId: args.inboxId,
        data: {
          ...(previousProfile || {}),
          ...args.profile,
        },
      });

      return { previousProfile };
    },
    onError: (error, variables, context) => {
      // Rollback to the previous profile data on error
      if (context?.previousProfile) {
        queryClient.setQueryData(
          ["profile", variables.inboxId],
          context.previousProfile
        );
      }
      
      // All errors are handled by the component via the error state
      // We don't need to do anything special here
      // This allows the component to display the error message
    },
    onSettled: (_, __, variables) => {
      // Always invalidate the profile query to ensure fresh data
      invalidateProfileQuery({ xmtpId: variables.inboxId });
    },
  });

  return {
    saveProfile: mutation.mutateAsync,
    isSaving: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
}
