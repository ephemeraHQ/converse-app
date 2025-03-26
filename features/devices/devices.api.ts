import { z } from "zod"
import { DeviceOSSchema, deviceSchema, IDevice } from "@/features/devices/devices.types"
import { captureError } from "@/utils/capture-error"
import { convosApi } from "@/utils/convos-api/convos-api-instance"

// Schema for device data validation

// Schema for device creation/update requests
const DeviceInputSchema = z.object({
  name: z.string().optional(),
  os: DeviceOSSchema,
  pushToken: z.string().optional(),
  expoToken: z.string().optional(),
})

export type IDeviceInput = z.infer<typeof DeviceInputSchema>

/**
 * Fetches a single device by ID
 */
export async function fetchDevice(args: { userId: string; deviceId: string }) {
  const { userId, deviceId } = args

  try {
    const { data } = await convosApi.get<IDevice>(`/api/v1/devices/${userId}/${deviceId}`)

    const result = deviceSchema.safeParse(data)
    if (!result.success) {
      captureError(result.error)
    }

    return data
  } catch (error) {
    throw error
  }
}

/**
 * Fetches all devices for a user
 */
export async function fetchUserDevices(args: { userId: string }) {
  const { userId } = args

  try {
    const { data } = await convosApi.get<IDevice[]>(`/api/v1/devices/${userId}`)

    const result = z.array(deviceSchema).safeParse(data)
    if (!result.success) {
      captureError(result.error)
    }

    return data
  } catch (error) {
    throw error
  }
}

/**
 * Creates a new device
 */
export async function createDevice(args: { userId: string; device: IDeviceInput }) {
  const { userId, device } = args

  try {
    // Validate the input data
    const validatedData = DeviceInputSchema.parse(device)

    const { data } = await convosApi.post<IDevice>(`/api/v1/devices/${userId}`, validatedData)

    const result = deviceSchema.safeParse(data)
    if (!result.success) {
      captureError(result.error)
    }

    return data
  } catch (error) {
    throw error
  }
}

/**
 * Updates an existing device
 */
export async function updateDevice(args: {
  userId: string
  deviceId: string
  updates: IDeviceInput
}) {
  const { userId, deviceId, updates } = args

  try {
    // Validate the update data
    const validatedData = DeviceInputSchema.parse(updates)

    const { data } = await convosApi.put<IDevice>(
      `/api/v1/devices/${userId}/${deviceId}`,
      validatedData,
    )

    const result = deviceSchema.safeParse(data)
    if (!result.success) {
      captureError(result.error)
    }

    return data
  } catch (error) {
    throw error
  }
}
