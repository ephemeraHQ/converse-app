import { queryOptions } from "@tanstack/react-query"
import * as Device from "expo-device"
import * as Notifications from "expo-notifications"
import { Linking, Platform } from "react-native"
import { captureError } from "@/utils/capture-error"
import { reactQueryClient } from "@/utils/react-query/react-query.client"

const getNotificationsPermissionsQueryConfig = () => {
  return queryOptions({
    queryKey: ["notifications-permissions"],
    queryFn: () => {
      return Notifications.getPermissionsAsync()
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: Infinity,
  })
}

export function getOrFetchNotificationsPermissions() {
  return reactQueryClient.ensureQueryData(getNotificationsPermissionsQueryConfig())
}

export async function userHasGrantedNotificationsPermissions() {
  const permission = await getOrFetchNotificationsPermissions()
  return permission.status === Notifications.PermissionStatus.GRANTED
}

export async function canAskForNotificationsPermissions() {
  const permission = await getOrFetchNotificationsPermissions()
  return permission.canAskAgain
}

/**
 * Registers device for push notifications and returns the device token
 */
export async function registerForPushNotificationsAsync() {
  let token

  // For Android, create a notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      enableVibrate: true,
    })
  }

  if (!Device.isDevice) {
    throw new Error("Must use physical device for push notifications")
  }

  // Get the token using getDevicePushTokenAsync
  try {
    token = (await Notifications.getDevicePushTokenAsync()).data
    console.log("Device Push Token:", token)
    return token
  } catch (error) {
    captureError(error)
    console.log("Error getting device push token:", error)
  }

  return token
}

export async function requestNotificationsPermissions() {
  if (!(await canAskForNotificationsPermissions())) {
    Linking.openSettings()
    return
  }

  if (Platform.OS === "android") {
    return Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      enableVibrate: true,
    })
  }

  return Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowCriticalAlerts: true,
    },
  })
}
