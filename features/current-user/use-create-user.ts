import { useMutation } from "@tanstack/react-query"
import { useCallback } from "react"
import { z } from "zod"
import { setCurrentUserQueryData } from "@/features/current-user/curent-user.query"
import { invalidateProfileQuery, setProfileQueryData } from "@/features/profiles/profiles.query"
import { profileValidationSchema } from "@/features/profiles/schemas/profile-validation.schema"
import { createUser } from "../authentication/create-user.api"

const createUserRequestSchema = z.object({
  inboxId: z.string(),
  privyUserId: z.string(),
  smartContractWalletAddress: z.string(),
  profile: profileValidationSchema.pick({
    name: true,
    username: true,
    avatar: true,
    description: true,
  }),
})

type ICreateUserArgs = z.infer<typeof createUserRequestSchema>

export function useCreateUser() {
  // const { logout } = useLogout();

  const { mutateAsync, isPending: isCreatingUser } = useMutation({
    mutationFn: async (args: ICreateUserArgs) => {
      return createUser(args)
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
      })
      setProfileQueryData({
        xmtpId: data.identity.xmtpId,
        data: {
          id: data.profile.id,
          name: data.profile.name,
          username: data.profile.username,
          description: data.profile.description ?? null,
          ...(data.profile.avatar && { avatar: data.profile.avatar }),
        },
      })

      // Explicitly refetch the profile data to ensure
      // we have the latest data including the newly uploaded avatar
      invalidateProfileQuery({ xmtpId: data.identity.xmtpId })
    },
  })

  const handleCreateUser = useCallback(
    async (args: ICreateUserArgs) => {
      // Validate the payload against our schema
      const validationResult = createUserRequestSchema.parse(args)
      await mutateAsync(validationResult)
    },
    [mutateAsync],
  )

  return {
    createUserAsync: handleCreateUser,
    isCreatingUser,
  }
}
