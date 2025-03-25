import AsyncStorage from "@react-native-async-storage/async-storage"

const DEVICE_ID_KEY = "@convos/device-id"

export async function getStoredDeviceId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(DEVICE_ID_KEY)
  } catch (error) {
    console.error("Failed to get stored device ID:", error)
    return null
  }
}

export async function storeDeviceId(deviceId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId)
  } catch (error) {
    console.error("Failed to store device ID:", error)
  }
}

export async function removeStoredDeviceId(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DEVICE_ID_KEY)
  } catch (error) {
    console.error("Failed to remove stored device ID:", error)
  }
}
