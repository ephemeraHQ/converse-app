import * as Notifications from "expo-notifications"
import {
  IConvosModifiedNotification,
  IExpoNewMessageNotification,
  IXmtpNewMessageNotification,
  IXmtpNotificationNewMessageTrigger,
} from "@/features/notifications/notifications.types"

export function isConvosModifiedNotification(
  notification: Notifications.Notification,
): notification is IConvosModifiedNotification {
  return !!notification.request.content.data?.isProcessedByConvo
}

export function isNotificationXmtpNewMessageNotification(
  notification: Notifications.Notification,
): notification is IXmtpNewMessageNotification {
  if (
    notification.request.trigger &&
    "payload" in notification.request.trigger &&
    notification.request.trigger.payload &&
    "messageKind" in notification.request.trigger.payload
  ) {
    const trigger = notification.request.trigger as unknown as IXmtpNotificationNewMessageTrigger
    return trigger.payload.messageKind === "v3-conversation"
  }
  return false
}

export function isNotificationExpoNewMessageNotification(
  notification: Notifications.Notification,
): notification is IExpoNewMessageNotification {
  return notification.request.content.data?.messageType === "v3-conversation"
}
