import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  saveProfileAsync, 
  IConvosProfileForInbox,
  ProfileUpdates,
  ProfileInput
} from "@/features/profiles/profiles.api";
import { captureErrorWithToast } from "@/utils/capture-error";
import { setProfileQueryData } from "@/features/profiles/profiles.query";
import { logger } from "@/utils/logger";

type SaveProfileArgs = {
  profile: ProfileInput;
  inboxId: string;
};

// Helper function to match the query key format in profiles.query.ts
const profileQueryKey = (xmtpId: string) => ["profile", xmtpId] as const;

/**
 * Compares a profile update with the current profile and returns only changed fields.
 * Treats null values as intentional clearing of fields.
 */
const getChangedFields = (
  update: ProfileInput, 
  current?: IConvosProfileForInbox
): ProfileUpdates => {
  logger.debug("[getChangedFields] Starting comparison", {
    update: JSON.stringify(update),
    current: current ? JSON.stringify(current) : null
  });

  if (!current) {
    // If we don't have current data, include all provided fields
    const { name, username, description, avatar } = update;
    const updates: ProfileUpdates = {};
    
    if (name !== undefined) updates.name = name;
    if (username !== undefined) updates.username = username;
    if (description !== undefined) updates.description = description;
    if (avatar !== undefined) updates.avatar = avatar;
    
    logger.debug("[getChangedFields] No current profile, returning all fields", {
      result: JSON.stringify(updates)
    });
    return updates;
  }
  
  // Only include fields that have changed
  const updates: ProfileUpdates = {};
  
  // Log each field comparison
  logger.debug("[getChangedFields] Field comparison", {
    name: { current: current.name, update: update.name, changed: update.name !== undefined && update.name !== current.name },
    username: { current: current.username, update: update.username, changed: update.username !== undefined && update.username !== current.username },
    description: { current: current.description, update: update.description, changed: update.description !== undefined && update.description !== current.description },
    avatar: { current: current.avatar, update: update.avatar, changed: update.avatar !== undefined && update.avatar !== current.avatar }
  });
  
  // CRITICAL FIX: Always include name and username in updates
  // These are required fields and should always be sent
  if (update.name !== undefined) {
    updates.name = update.name;
  }
  
  if (update.username !== undefined) {
    updates.username = update.username;
  }
  
  // For nullable fields, include them if they're defined in the update
  if (update.description !== undefined) {
    updates.description = update.description;
  }
  
  if (update.avatar !== undefined) {
    updates.avatar = update.avatar;
  }
  
  logger.debug("[getChangedFields] Final result", {
    result: JSON.stringify(updates)
  });
  
  return updates;
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
      // Get the current profile data to compare with
      const currentProfile = queryClient.getQueryData(
        profileQueryKey(args.inboxId)
      ) as IConvosProfileForInbox | undefined;
      
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
      
      // CRITICAL FIX: Don't use getChangedFields here, as it's already handled in saveProfileAsync
      // This prevents duplicate processing and duplicate requests
      
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
      const previousProfile = queryClient.getQueryData(
        profileQueryKey(args.inboxId)
      ) as IConvosProfileForInbox | undefined;

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
          profileQueryKey(variables.inboxId),
          context.previousProfile
        );
      }
      
      // All errors are handled by the component via the error state
      // We don't need to do anything special here
      // This allows the component to display the error message
    },
    onSettled: (_, __, variables) => {
      // Always invalidate the profile query to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: profileQueryKey(variables.inboxId),
      });
    },
  });

  // Extract mutateAsync to avoid the linter warning about dependencies
  const { mutateAsync } = mutation;
  
  const saveProfile = useCallback(
    (args: SaveProfileArgs) => mutateAsync(args),
    [mutateAsync]
  );

  return {
    saveProfile,
    isSaving: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
}
