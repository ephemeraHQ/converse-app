import { useMutation, type UseMutationOptions } from "@tanstack/react-query"
import * as Device from "expo-device"
import * as Notifications from "expo-notifications"
import { Platform } from "react-native"
import { getStoredDeviceId, storeDeviceId } from "./device.storage"
import { createDevice, fetchDeviceById, linkDeviceIdentity, updateDevice } from "./devices.api"
import type { IDevice, IDeviceInput } from "./devices.types"

type ICreateDeviceArgs = {
  userId: string
}

type IUpdateDeviceArgs = {
  userId: string
  deviceId: string
  updates: IDeviceInput
}

type ILinkDeviceIdentityArgs = {
  userId: string
  deviceId: string
  identityId: string
}

/**
 * Gets the current device OS
 */
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

/**
 * Gets a human-readable device name
 */
async function getDeviceName(): Promise<string> {
  if (Platform.OS === "web") {
    return "Web Browser"
  }

  const deviceType = await Device.getDeviceTypeAsync()
  const deviceName = (await Device.getDeviceNameAsync()) || "Unknown Device"

  switch (deviceType) {
    case Device.DeviceType.PHONE:
      return `${deviceName} (Phone)`
    case Device.DeviceType.TABLET:
      return `${deviceName} (Tablet)`
    case Device.DeviceType.DESKTOP:
      return `${deviceName} (Desktop)`
    case Device.DeviceType.TV:
      return `${deviceName} (TV)`
    default:
      return deviceName
  }
}

/**
 * Registers for push notifications and returns the token
 */
async function registerForPushNotifications() {
  if (Platform.OS === "web") return undefined

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== "granted") {
      return undefined
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data
    return token
  } catch (error) {
    console.error("Failed to get push token:", error)
    return undefined
  }
}

/**
 * Hook for managing device mutations
 */
export function useDeviceMutation(options?: {
  onCreateSuccess?: (device: IDevice) => void
  onUpdateSuccess?: (device: IDevice) => void
  onLinkSuccess?: (device: IDevice) => void
}) {
  // Initialize device mutation - handles both creation and retrieval
  const { mutateAsync: initializeDeviceAsync } = useMutation({
    mutationFn: async ({ userId }: ICreateDeviceArgs) => {
      // Check if we have a stored device ID
      const storedDeviceId = await getStoredDeviceId()

      if (storedDeviceId) {
        // Try to fetch the existing device
        const existingDevice = await fetchDeviceById({ userId, deviceId: storedDeviceId })

        if (existingDevice) {
          // Update the device with latest info
          const token = await registerForPushNotifications()
          if (token && token !== existingDevice.pushToken) {
            return updateDevice({
              userId,
              deviceId: existingDevice.id,
              updates: { pushToken: token },
            })
          }
          return existingDevice
        }
      }

      // Create a new device if no existing device found
      const deviceInput: IDeviceInput = {
        name: await getDeviceName(),
        os: getDeviceOS(),
        pushToken: await registerForPushNotifications(),
      }

      const newDevice = await createDevice({ userId, device: deviceInput })

      // Store the new device ID
      await storeDeviceId(newDevice.id)

      return newDevice
    },
    onSuccess: options?.onCreateSuccess,
  } satisfies UseMutationOptions<IDevice, Error, ICreateDeviceArgs>)

  // Update device mutation
  const { mutateAsync: updateDeviceAsync } = useMutation({
    mutationFn: async ({ userId, deviceId, updates }: IUpdateDeviceArgs) => {
      return updateDevice({ userId, deviceId, updates })
    },
    onSuccess: options?.onUpdateSuccess,
  } satisfies UseMutationOptions<IDevice, Error, IUpdateDeviceArgs>)

  // Link identity mutation
  const { mutateAsync: linkDeviceIdentityAsync } = useMutation({
    mutationFn: async ({ userId, deviceId, identityId }: ILinkDeviceIdentityArgs) => {
      return linkDeviceIdentity({ userId, deviceId, identityId })
    },
    onSuccess: options?.onLinkSuccess,
  } satisfies UseMutationOptions<IDevice, Error, ILinkDeviceIdentityArgs>)

  return {
    initializeDeviceAsync,
    updateDeviceAsync,
    linkDeviceIdentityAsync,
  }
}
