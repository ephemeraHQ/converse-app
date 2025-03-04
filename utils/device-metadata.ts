import * as Device from "expo-device"
import { Platform } from "react-native"

type IDevice = {
  os: "android" | "ios"
  name: string | null
}

export const buildDeviceMetadata = (): IDevice => {
  return {
    os: Platform.OS.toLowerCase() as "android" | "ios",
    name: Device.modelId,
  }
}
