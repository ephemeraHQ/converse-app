import { useMutation } from "@tanstack/react-query"
import { setCurrentUserQueryData } from "@/features/current-user/current-user.query"
import { storeDeviceId } from "@/features/devices/device.storage"
import { setProfileQueryData } from "@/features/profiles/profiles.query"
import { captureError } from "@/utils/capture-error"
import { createUser, ICreateUserArgs } from "./create-user.api"

export type ICreateUserMutationArgs = ICreateUserArgs

export function useCreateUserMutation() {
  return useMutation({
    mutationFn: async (args: ICreateUserArgs) => {
      return createUser(args)
    },

    // onMutate: async (args: ICreateUserArgs) => {
    //   setCurrentUserQueryData({
    //     user: {
    //       id: getRandomId() as IConvosCurrentUserId,
    //       identities: [
    //         {
    //           id: args.identity.xmtpId,
    //           privyAddress: args.identity.privyAddress,
    //           xmtpId: args.identity.xmtpId,
    //         },
    //       ],
    //     },
    //   })

    //   const optimisticProfile: IConvosProfileForInboxUpdate = {
    //     id: optimisticUser.profile.id,
    //     name: optimisticUser.profile.name,
    //     description: optimisticUser.profile.description,
    //   }

    //   setProfileQueryData({
    //     xmtpId: args.inboxId,
    //     data: optimisticProfile,
    //   })

    //   return {
    //     optimisticUser,
    //     optimisticProfile,
    //   }
    // },

    onSuccess: (data) => {
      // Store the device ID
      storeDeviceId(data.device.id).catch(captureError)

      setCurrentUserQueryData({
        user: {
          id: data.id,
          // deviceId: data.device.id,
          identities: [data.identity],
        },
      })
      setProfileQueryData({
        xmtpId: data.identity.xmtpId,
        profile: {
          id: data.profile.id,
          name: data.profile.name,
          username: data.profile.username,
          description: data.profile.description ?? null,
          avatar: data.profile.avatar ?? null,
          privyAddress: data.identity.privyAddress,
          xmtpId: data.identity.xmtpId,
        },
      })
    },
  })
}
