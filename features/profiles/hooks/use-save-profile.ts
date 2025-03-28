import { useMutation } from "@tanstack/react-query"
import { ISaveProfileUpdates, saveProfile } from "@/features/profiles/profiles.api"
import {
  getProfileQueryData,
  invalidateProfileQuery,
  setProfileQueryData,
  updateProfileQueryData,
} from "@/features/profiles/profiles.query"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { captureError } from "@/utils/capture-error"

type ISaveProfileArgs = {
  profileUpdates: ISaveProfileUpdates
  inboxId: IXmtpInboxId
}

export function useSaveProfile() {
  const mutation = useMutation({
    mutationFn: (args: ISaveProfileArgs) => {
      return saveProfile(args)
    },
    onMutate: async (args) => {
      const { profileUpdates, inboxId } = args

      const previousProfile = getProfileQueryData({
        xmtpId: inboxId,
      })

      updateProfileQueryData({
        xmtpId: inboxId,
        data: profileUpdates,
      })

      return { previousProfile }
    },
    onError: (error, variables, context) => {
      if (context?.previousProfile) {
        setProfileQueryData({
          xmtpId: variables.inboxId,
          profile: context.previousProfile,
        })
      }
    },
    onSettled: (_, __, variables) => {
      invalidateProfileQuery({ xmtpId: variables.inboxId, caller: "useSaveProfile" }).catch(
        captureError,
      )
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
