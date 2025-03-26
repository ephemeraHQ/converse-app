import { z } from "zod"

export const DeviceOSSchema = z.enum(["ios", "android", "web", "macos"])
export type IDeviceOS = z.infer<typeof DeviceOSSchema>

export type IDeviceId = string & { readonly __brand: unique symbol }

export const deviceSchema = z.object({
  id: z.custom<IDeviceId>(),
  userId: z.string(),
  os: DeviceOSSchema,
  name: z.string().nullable(),
  pushToken: z.string().nullable(),
  expoToken: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type IDevice = z.infer<typeof deviceSchema>

export const DeviceInputSchema = z.object({
  name: z.string().optional(),
  os: DeviceOSSchema,
  pushToken: z.string().optional(),
  expoToken: z.string().optional(),
})

export type IDeviceInput = z.infer<typeof DeviceInputSchema>

// Helper type for the relationship between devices and identities
export type IDeviceIdentityRelation = {
  deviceId: string
  identityId: string
}
