import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type IConvosProfileForInbox, type ProfileInput } from "@/features/profiles/profile.types"
import { saveProfileAsync } from "@/features/profiles/profiles.api"
import {
  getProfileQueryData,
  invalidateProfileQuery,
  setProfileQueryData,
} from "@/features/profiles/profiles.query"

type SaveProfileArgs = {
  profile: ProfileInput
  inboxId: string
}

/**
 * Hook for saving profile data using React Query's useMutation
 * with optimistic updates for a better user experience
 *
 * @returns An object containing the save function and mutation state
 */
export function useSaveProfile() {
  const mutation = useMutation({
    mutationFn: (args: SaveProfileArgs) => {
      const profileWithXmtpId = {
        ...args.profile,
        xmtpId: args.inboxId,
      }
      return saveProfileAsync({
        profile: profileWithXmtpId,
        inboxId: args.inboxId,
      })
    },
    onMutate: async (args) => {
      // Capture the previous profile data for rollback
      const previousProfile = getProfileQueryData({
        xmtpId: args.inboxId,
      }) as IConvosProfileForInbox | undefined

      // Optimistically update the profile in the cache
      setProfileQueryData({
        xmtpId: args.inboxId,
        data: {
          ...(previousProfile || {}),
          ...args.profile,
        },
      })

      return { previousProfile }
    },
    onError: (error, variables, context) => {
      // Rollback to the previous profile data on error
      if (context?.previousProfile) {
        setProfileQueryData({
          xmtpId: variables.inboxId,
          data: context.previousProfile,
        })
      }

      // All errors are handled by the component via the error state
      // We don't need to do anything special here
      // This allows the component to display the error message
    },
    onSettled: (_, __, variables) => {
      // Always invalidate the profile query to ensure fresh data
      invalidateProfileQuery({ xmtpId: variables.inboxId })
    },
  })

  return {
    saveProfile: mutation.mutateAsync,
    isSaving: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  }
}
