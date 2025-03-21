import * as Device from "expo-device"
import * as Notifications from "expo-notifications"
import { Platform } from "react-native"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { ensureNotificationsPermissions } from "@/features/notifications/notifications-permissions.query"
import { registerNotificationInstallation } from "@/features/notifications/notifications.api"
import { ensureXmtpInstallationQueryData } from "@/features/xmtp/xmtp-installations/xmtp-installation.query"
import { GenericError, NotificationError } from "@/utils/error"
import { notificationsLogger } from "@/utils/logger"

// Full flow
export async function registerPushNotifications() {
  try {
    const result = await requestNotificationsPermissions()

    notificationsLogger.debug("Notification permissions result:", result)

    if (!result.granted) {
      throw new Error("Notifications permissions not granted")
    }

    notificationsLogger.debug(
      "Notification permissions granted, registering for push notifications",
    )
    const token = await getPushNotificationsToken()
    notificationsLogger.debug("Device push token received:", token)

    const currentSender = getSafeCurrentSender()

    notificationsLogger.debug(`Getting XMTP installation ID for sender: ${currentSender.inboxId}`)
    const installationId = await ensureXmtpInstallationQueryData({
      inboxId: currentSender.inboxId,
    })

    notificationsLogger.debug("Registering notification installation")
    await registerNotificationInstallation({
      installationId,
      deliveryMechanism: {
        deliveryMechanismType: {
          case: "apnsDeviceToken",
          value: token,
        },
      },
    })
    notificationsLogger.debug("Notification installation registered")
  } catch (error) {
    throw new NotificationError({
      error,
      additionalMessage: "Error registering notification installation",
    })
  }
}

export async function getPushNotificationsToken() {
  try {
    if (!Device.isDevice) {
      throw new Error("Must use physical")
    }

    let token

    // Check if permissions are granted
    const hasPermissions = await userHasGrantedNotificationsPermissions()

    if (!hasPermissions) {
      throw new Error("Notifications permissions not granted")
    }

    const data = await Notifications.getDevicePushTokenAsync()

    // data.data is string for native platforms per DevicePushToken type
    // https://docs.expo.dev/versions/latest/sdk/notifications/#devicepushtoken
    token = data.data as string

    notificationsLogger.debug("Device Push Token:", token)
    return token
  } catch (error) {
    throw new GenericError({
      error,
      additionalMessage: "Error getting device push token",
    })
  }
}

export async function requestNotificationsPermissions(): Promise<{ granted: boolean }> {
  const hasGranted = await userHasGrantedNotificationsPermissions()

  if (hasGranted) {
    return { granted: true }
  }

  if (Platform.OS === "android") {
    // Android doesn't require explicit permission for notifications
    // Notification channels are set up in configureForegroundNotificationBehavior
    return { granted: true }
  }

  const result = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowCriticalAlerts: true,
    },
  })

  return { granted: result.status === Notifications.PermissionStatus.GRANTED }
}

export async function userHasGrantedNotificationsPermissions() {
  const permission = await ensureNotificationsPermissions()
  return permission.status === Notifications.PermissionStatus.GRANTED
}

export async function canAskForNotificationsPermissions() {
  const permission = await ensureNotificationsPermissions()
  return permission.canAskAgain
}
