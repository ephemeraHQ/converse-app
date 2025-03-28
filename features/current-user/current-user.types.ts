import { z } from "zod"
import { deviceSchema } from "@/features/devices/devices.types"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { IEthereumAddress } from "@/utils/evm/address"

export type IConvosCurrentUserId = string & { readonly __brand: unique symbol }

export type IConvosCurrentUser = z.infer<typeof currentUserSchema>

export const identitySchema = z.object({
  id: z.string(),
  privyAddress: z.custom<IEthereumAddress>(),
  xmtpId: z.custom<IXmtpInboxId>(),
})

export const currentUserSchema = z.object({
  id: z.custom<IConvosCurrentUserId>(),
  //   deviceId: deviceSchema.pick({
  //     id: true,
  //   }),
  identities: z.array(identitySchema),
})
