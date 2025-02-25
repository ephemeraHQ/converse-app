import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveProfileAsync } from "@/features/profiles/profiles.api";
import { captureErrorWithToast } from "@/utils/capture-error";
import { setProfileQueryData } from "@/features/profiles/profiles.query";

type SaveProfileArgs = {
  profile: {
    id?: string;
    name?: string;
    description?: string;
    username?: string;
    avatar?: string;
  };
  inboxId: string;
};

// Helper function to match the query key format in profiles.query.ts
const profileQueryKey = (xmtpId: string) => ["profile", xmtpId] as const;

/**
 * Hook for saving profile data using React Query's useMutation
 * with optimistic updates for a better user experience
 * 
 * @returns An object containing the save function and mutation state
 */
export function useSaveProfile() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (args: SaveProfileArgs) => saveProfileAsync(args),
    onMutate: async (args) => {
      // Capture the previous profile data for rollback
      const previousProfile = queryClient.getQueryData(
        profileQueryKey(args.inboxId)
      );

      // Optimistically update the profile in the cache
      setProfileQueryData({
        xmtpId: args.inboxId,
        data: {
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
      captureErrorWithToast(error);
    },
    onSettled: (_, __, variables) => {
      // Always invalidate the profile query to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: profileQueryKey(variables.inboxId),
      });
    },
  });

  // Destructure mutateAsync to avoid referential stability issues
  const { mutateAsync } = mutation;

  const saveProfile = useCallback(async (args: SaveProfileArgs) => {
    return mutateAsync(args);
  }, [mutateAsync]);

  return {
    saveProfile,
    isSaving: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
}
