import { z } from "zod"

export const DeviceOSSchema = z.enum(["ios", "android", "web"])
export type IDeviceOS = z.infer<typeof DeviceOSSchema>

export const DeviceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().optional(),
  os: DeviceOSSchema,
  pushToken: z.string().optional(),
  expoToken: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  identities: z.array(
    z.object({
      deviceId: z.string(),
      identityId: z.string(),
    }),
  ),
})

export type IDevice = z.infer<typeof DeviceSchema>

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
