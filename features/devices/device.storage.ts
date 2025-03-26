import AsyncStorage from "@react-native-async-storage/async-storage"
import { IDeviceId } from "@/features/devices/devices.types"
import { StorageError } from "@/utils/error"

const DEVICE_ID_KEY = "@convos/device-id"

export async function getStoredDeviceId() {
  try {
    return (await AsyncStorage.getItem(DEVICE_ID_KEY)) as IDeviceId | null
  } catch (error) {
    throw new StorageError({
      error,
      additionalMessage: "Failed to get stored device ID",
    })
  }
}

export async function storeDeviceId(deviceId: IDeviceId) {
  try {
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId)
  } catch (error) {
    throw new StorageError({
      error,
      additionalMessage: "Failed to store device ID",
    })
  }
}

export async function removeStoredDeviceId() {
  try {
    await AsyncStorage.removeItem(DEVICE_ID_KEY)
  } catch (error) {
    throw new StorageError({
      error,
      additionalMessage: "Failed to remove stored device ID",
    })
  }
}
