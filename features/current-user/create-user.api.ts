import { z } from "zod"
import { IPrivyUserId } from "@/features/authentication/authentication.types"
import { IConvosCurrentUserId, identitySchema } from "@/features/current-user/current-user.types"
import { deviceSchema } from "@/features/devices/devices.types"
import { getDeviceModelId, getDeviceOs } from "@/features/devices/devices.utils"
import { ConvosProfileSchema, IConvosProfile } from "@/features/profiles/profiles.types"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { captureError } from "@/utils/capture-error"
import { ApiError } from "@/utils/convos-api/convos-api-error"
import { convosApi } from "@/utils/convos-api/convos-api-instance"
import { IEthereumAddress } from "@/utils/evm/address"

const createUserApiRequestBodySchema = z
  .object({
    privyUserId: z.string(),
    device: deviceSchema.pick({
      os: true,
      name: true,
    }),
    identity: identitySchema.pick({
      privyAddress: true,
      xmtpId: true,
    }),
    profile: ConvosProfileSchema.pick({
      name: true,
      username: true,
      avatar: true,
      description: true,
    }),
  })
  .strict()

export type ICreateUserApiRequestBody = z.infer<typeof createUserApiRequestBodySchema>

const createUserApiResponseSchema = z.object({
  id: z.custom<IConvosCurrentUserId>(),
  privyUserId: z.custom<IPrivyUserId>(),
  device: deviceSchema.pick({
    id: true,
    os: true,
    name: true,
  }),
  identity: identitySchema.pick({
    id: true,
    privyAddress: true,
    xmtpId: true,
  }),
  profile: ConvosProfileSchema.pick({
    id: true,
    name: true,
    username: true,
    avatar: true,
    description: true,
  }),
})

type CreateUserResponse = z.infer<typeof createUserApiResponseSchema>

export type ICreateUserArgs = {
  inboxId: IXmtpInboxId
  privyUserId: IPrivyUserId
  smartContractWalletAddress: IEthereumAddress
  profile: Pick<IConvosProfile, "name" | "username" | "avatar" | "description">
}

export async function createUser(args: ICreateUserArgs) {
  const { privyUserId, smartContractWalletAddress, inboxId, profile } = args

  try {
    const requestPayload = {
      privyUserId,
      device: {
        os: getDeviceOs(),
        name: getDeviceModelId(),
      },
      identity: {
        privyAddress: smartContractWalletAddress,
        xmtpId: inboxId,
      },
      profile,
    } satisfies ICreateUserApiRequestBody

    createUserApiRequestBodySchema.parse(requestPayload)

    const apiResponse = await convosApi.post<CreateUserResponse>("/api/v1/users", requestPayload)

    const responseValidation = createUserApiResponseSchema.safeParse(apiResponse.data)

    if (!responseValidation.success) {
      captureError(
        new ApiError({
          error: responseValidation.error,
          additionalMessage: "Invalid create user response data",
        }),
      )
    }

    return apiResponse.data
  } catch (error) {
    throw new ApiError({
      error,
      additionalMessage: "Failed to create user",
    })
  }
}
