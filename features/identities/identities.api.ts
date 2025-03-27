import { z } from "zod"
import { IConvosCurrentUserId } from "@/features/current-user/current-user.types"
import { IDeviceId } from "@/features/devices/devices.types"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { captureError } from "@/utils/capture-error"
import { convosApi } from "@/utils/convos-api/convos-api-instance"
import { ValidationError } from "@/utils/error"
import { IEthereumAddress } from "@/utils/evm/address"

type IDeviceIdentityId = string & { readonly __brand: unique symbol }

// Schema definitions
export const DeviceIdentitySchema = z.object({
  id: z.custom<IDeviceIdentityId>(),
  xmtpId: z.string().optional(),
  privyAddress: z.string(),
  userId: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type IDeviceIdentity = z.infer<typeof DeviceIdentitySchema>

// API functions
export const fetchDeviceIdentities = async (args: { deviceId: IDeviceId }) => {
  const { deviceId } = args

  const { data } = await convosApi.get<IDeviceIdentity[]>(`/api/v1/identities/device/${deviceId}`)

  const result = z.array(DeviceIdentitySchema).safeParse(data)
  if (!result.success) {
    captureError(new ValidationError({ error: result.error }))
  }

  return data
}

export const fetchUserIdentities = async (args: { userId: IConvosCurrentUserId }) => {
  const { userId } = args

  const { data } = await convosApi.get<IDeviceIdentity[]>(`/api/v1/identities/user/${userId}`)

  const result = z.array(DeviceIdentitySchema).safeParse(data)
  if (!result.success) {
    captureError(new ValidationError({ error: result.error }))
  }

  return data
}

export const fetchIdentity = async (args: { identityId: IDeviceIdentityId }) => {
  const { identityId } = args

  const { data } = await convosApi.get<IDeviceIdentity>(`/api/v1/identities/${identityId}`)

  const result = DeviceIdentitySchema.safeParse(data)
  if (!result.success) {
    captureError(new ValidationError({ error: result.error }))
  }

  return data
}

export type ICreateIdentityInput = {
  xmtpId: IXmtpInboxId
  privyAddress: IEthereumAddress
}

export const createIdentity = async (args: {
  deviceId: IDeviceId
  input: ICreateIdentityInput
}) => {
  const { deviceId, input } = args

  const { data } = await convosApi.post<IDeviceIdentity>(
    `/api/v1/identities/device/${deviceId}`,
    input,
  )

  const result = DeviceIdentitySchema.safeParse(data)
  if (!result.success) {
    captureError(new ValidationError({ error: result.error }))
  }

  return data
}

export const updateIdentity = async (args: {
  identityId: IDeviceIdentityId
  updates: ICreateIdentityInput
}) => {
  const { identityId, updates } = args

  const { data } = await convosApi.put<IDeviceIdentity>(`/api/v1/identities/${identityId}`, updates)

  const result = DeviceIdentitySchema.safeParse(data)
  if (!result.success) {
    captureError(new ValidationError({ error: result.error }))
  }

  return data
}

export const linkIdentityToDevice = async (args: {
  identityId: IDeviceIdentityId
  deviceId: IDeviceId
}) => {
  const { identityId, deviceId } = args

  const { data } = await convosApi.post<{ deviceId: IDeviceId; identityId: IDeviceIdentityId }>(
    `/api/v1/identities/${identityId}/link`,
    { deviceId },
  )

  return data
}

export const unlinkIdentityFromDevice = async (args: {
  identityId: IDeviceIdentityId
  deviceId: IDeviceId
}) => {
  const { identityId, deviceId } = args

  await convosApi.delete(`/api/v1/identities/${identityId}/link`, {
    data: { deviceId },
  })
}
