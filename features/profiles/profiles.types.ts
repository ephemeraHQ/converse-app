import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { z } from "zod"
import { IEthereumAddress } from "@/utils/evm/address"

export type IConvosProfileId = string & { readonly __brand: unique symbol }

export const ConvosProfileSchema = z.object({
  id: z.custom<IConvosProfileId>(),
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" })
    .max(50, { message: "Name cannot exceed 50 characters" })
    .regex(/^[a-zA-Z0-9\s.]+$/, {
      message: "Name can only contain letters, numbers, spaces", // "and dots". Don't put in error because it's only for import names we just put in regex so it doesn't give errors
    }),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long" })
    .max(50, { message: "Username cannot exceed 50 characters" })
    .regex(/^[a-zA-Z0-9-]+$/, {
      message: "Username can only contain letters, numbers and dashes",
    }),
  description: z
    .string()
    .max(500, { message: "Description cannot exceed 500 characters" })
    .nullable(),
  avatar: z.string().url({ message: "Avatar must be a valid URL" }).nullable(),
  xmtpId: z.custom<IXmtpInboxId>(),
  privyAddress: z.custom<IEthereumAddress>(), // TODO: Maybe this should be changed to simply ethAddress? Let's check thing again once we add multi identity support
})

export type IConvosProfile = z.infer<typeof ConvosProfileSchema>
