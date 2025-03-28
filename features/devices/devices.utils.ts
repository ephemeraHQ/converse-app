import * as Device from "expo-device"
import { Platform } from "react-native"
import { IDeviceOS } from "@/features/devices/devices.types"

export function getDeviceModelId() {
  return Device.modelId
}

export function getDeviceOs() {
  return Platform.OS.toLowerCase() as IDeviceOS
}
