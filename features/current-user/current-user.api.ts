import { currentUserSchema, IConvosCurrentUser } from "@/features/current-user/current-user.types"
import { getStoredDeviceId } from "@/features/devices/device.storage"
import { captureError } from "@/utils/capture-error"
import { convosApi } from "@/utils/convos-api/convos-api-instance"

export async function fetchCurrentUser() {
  // Because ideally we want the identities for this specific device
  // If we didn't store the device id or can't get it, it will return the current user with all identities for now
  const deviceId = await getStoredDeviceId()

  const { data } = await convosApi.get<IConvosCurrentUser>(
    deviceId ? `/api/v1/users/me?device_id=${deviceId}` : "/api/v1/users/me",
  )

  const parseResult = currentUserSchema.safeParse(data)

  if (!parseResult.success) {
    captureError(
      new Error(`Failed to parse current user response: ${JSON.stringify(parseResult.error)}`),
    )
  }

  return data
}
