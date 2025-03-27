import { IDeviceId } from "@/features/devices/devices.types"
import { StorageError } from "@/utils/error"
import { secureStorage } from "@/utils/storage/secure-storage"

const DEVICE_ID_KEY = "convos-device-id"

export async function getStoredDeviceId() {
  try {
    return (await secureStorage.getItem(DEVICE_ID_KEY)) as IDeviceId | null
  } catch (error) {
    throw new StorageError({
      error,
      additionalMessage: "Failed to get stored device ID",
    })
  }
}

export async function storeDeviceId(deviceId: IDeviceId) {
  try {
    await secureStorage.setItem(DEVICE_ID_KEY, deviceId)
  } catch (error) {
    throw new StorageError({
      error,
      additionalMessage: "Failed to store device ID",
    })
  }
}

export async function removeStoredDeviceId() {
  try {
    await secureStorage.deleteItem(DEVICE_ID_KEY)
  } catch (error) {
    throw new StorageError({
      error,
      additionalMessage: "Failed to remove stored device ID",
    })
  }
}
