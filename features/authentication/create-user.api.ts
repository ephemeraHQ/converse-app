import { z } from "zod"
import { profileValidationSchema } from "@/features/profiles/schemas/profile-validation.schema"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { api } from "@/utils/api/api"
import { captureError } from "@/utils/capture-error"
import { buildDeviceMetadata } from "@/utils/device-metadata"
import { ApiError } from "@/utils/error"
import { IEthereumAddress } from "@/utils/evm/address"

const deviceOSEnum = z.enum(["android", "ios", "web"])
const createUserApiRequestBodySchema = z
  .object({
    privyUserId: z.string(),
    device: z.object({
      os: deviceOSEnum,
      name: z.string().nullable(),
    }),
    identity: z.object({
      privyAddress: z.string(),
      xmtpId: z.string(),
    }),
    profile: profileValidationSchema.pick({
      name: true,
      username: true,
      avatar: true,
    }),
  })
  .strict()

const createUserApiResponseSchema = z.object({
  id: z.string(),
  privyUserId: z.string(),
  device: z.object({
    id: z.string(),
    os: deviceOSEnum,
    name: z.string().nullable(),
  }),
  identity: z.object({
    id: z.string(),
    privyAddress: z.custom<IEthereumAddress>(),
    xmtpId: z.custom<IXmtpInboxId>(),
  }),
  profile: z.object({
    id: z.string(),
    name: z.string(),
    username: z.string(),
    description: z.string().nullable(),
    avatar: z.string().nullable().optional(),
  }),
})

type CreateUserResponse = z.infer<typeof createUserApiResponseSchema>

export const createUser = async (args: {
  privyUserId: string
  smartContractWalletAddress: string
  inboxId: IXmtpInboxId
  profile: {
    name: string
    username: string
    avatar?: string
  }
}) => {
  const { privyUserId, smartContractWalletAddress, inboxId, profile } = args

  try {
    const requestPayload = {
      privyUserId,
      device: buildDeviceMetadata(),
      identity: {
        privyAddress: smartContractWalletAddress,
        xmtpId: inboxId,
      },
      profile,
    }

    const validationResult = createUserApiRequestBodySchema.safeParse(requestPayload)

    if (!validationResult.success) {
      throw new Error(`Invalid request body: ${validationResult.error.message}`)
    }

    const apiResponse = await api.post<CreateUserResponse>("/api/v1/users", validationResult.data)

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
