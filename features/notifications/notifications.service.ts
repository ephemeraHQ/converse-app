import * as Device from "expo-device"
import * as Notifications from "expo-notifications"
import { Platform } from "react-native"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import {
  messageContentIsMultiRemoteAttachment,
  messageContentIsRemoteAttachment,
} from "@/features/conversation/conversation-chat/conversation-message/utils/conversation-message-assertions"
import { convertXmtpMessageToConvosMessage } from "@/features/conversation/conversation-chat/conversation-message/utils/convert-xmtp-message-to-convos-message"
import { ensureConversationQueryData } from "@/features/conversation/queries/conversation.query"
import { ensureNotificationsPermissions } from "@/features/notifications/notifications-permissions.query"
import { registerNotificationInstallation } from "@/features/notifications/notifications.api"
import { INotificationMessageDataConverted } from "@/features/notifications/notifications.types"
import { ensurePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info"
import { getXmtpConversationIdFromXmtpTopic } from "@/features/xmtp/xmtp-conversations/xmtp-conversation"
import { ensureXmtpInstallationQueryData } from "@/features/xmtp/xmtp-installations/xmtp-installation.query"
import { decryptXmtpMessage } from "@/features/xmtp/xmtp-messages/xmtp-messages"
import { IXmtpConversationTopic } from "@/features/xmtp/xmtp.types"
import { getCurrentRoute } from "@/navigation/navigation.utils"
import { GenericError, NotificationError } from "@/utils/error"
import { notificationsLogger } from "@/utils/logger"
import { ensureMessageContentStringValue } from "../conversation/conversation-list/hooks/use-message-content-string-value"

// Full flow
export async function registerPushNotifications() {
  try {
    const result = await requestNotificationsPermissions()

    if (!result.granted) {
      throw new Error("Notifications permissions not granted")
    }

    const token = await getPushNotificationsToken()

    const currentSender = getSafeCurrentSender()

    const installationId = await ensureXmtpInstallationQueryData({
      inboxId: currentSender.inboxId,
    })

    notificationsLogger.debug("Registering notification installation...")
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

export function displayLocalNotification(args: Notifications.NotificationRequestInput) {
  return Notifications.scheduleNotificationAsync(args)
}

export async function maybeDisplayLocalNewMessageNotification(args: {
  encryptedMessage: string
  topic: IXmtpConversationTopic
}) {
  try {
    const { encryptedMessage, topic } = args

    const xmtpConversationId = getXmtpConversationIdFromXmtpTopic(topic)

    // Check if the user is already in this conversation
    const currentRoute = getCurrentRoute()
    if (
      currentRoute?.name === "Conversation" &&
      currentRoute.params.xmtpConversationId === xmtpConversationId
    ) {
      notificationsLogger.debug("User is already in this conversation, don't show notification")
      return
    }

    const conversation = await ensureConversationQueryData({
      clientInboxId: getSafeCurrentSender().inboxId,
      xmtpConversationId,
      caller: "notifications-foreground-handler",
    })

    if (!conversation) {
      throw new NotificationError({
        error: `Conversation (${xmtpConversationId}) not found`,
      })
    }

    const xmtpDecryptedMessage = await decryptXmtpMessage({
      encryptedMessage,
      xmtpConversationId: conversation.xmtpId,
      clientInboxId: getSafeCurrentSender().inboxId,
    })

    const convoMessage = convertXmtpMessageToConvosMessage(xmtpDecryptedMessage)

    const messageContentString = await ensureMessageContentStringValue(convoMessage)

    const { displayName: senderDisplayName } = await ensurePreferredDisplayInfo({
      inboxId: convoMessage.senderInboxId,
    })

    return displayLocalNotification({
      content: {
        title: senderDisplayName,
        body: messageContentString,
        data: {
          message: convoMessage,
          isProcessedByConvo: true,
        } satisfies INotificationMessageDataConverted,
        ...(messageContentIsRemoteAttachment(convoMessage.content)
          ? {
              attachments: [
                {
                  identifier: convoMessage.content.url,
                  type: "image",
                  url: convoMessage.content.url,
                },
              ],
            }
          : messageContentIsMultiRemoteAttachment(convoMessage.content)
            ? {
                attachments: convoMessage.content.attachments.map((attachment) => ({
                  identifier: attachment.url,
                  type: "image",
                  url: attachment.url,
                })),
              }
            : {}),
      },
      trigger: null, // Show immediately
    })
  } catch (error) {
    throw new NotificationError({
      error,
      additionalMessage: "Error displaying local new message notification",
    })
  }
}
