import * as Notifications from "expo-notifications"
import { useCallback } from "react"
import { Platform } from "react-native"

export function useDevice() {
  const createDeviceIfMissing = useCallback(() => {}, [])

  return {
    createDeviceIfMissing,
  }
}

function getDeviceOS() {
  switch (Platform.OS) {
    case "ios":
      return "ios" as const
    case "android":
      return "android" as const
    default:
      return "web" as const
  }
}
