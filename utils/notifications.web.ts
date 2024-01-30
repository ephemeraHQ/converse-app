import * as Notifications from "expo-notifications";

import { XmtpConversation } from "../data/store/chatStore";

export type NotificationPermissionStatus =
  | "granted"
  | "undetermined"
  | "denied";

export const deleteSubscribedTopics = (account: string) => {};

export const subscribeToNotifications = async (
  account: string
): Promise<void> => {};

export const unsubscribeFromNotifications = async (apiHeaders: {
  [key: string]: string;
}): Promise<void> => {};

export const requestPushNotificationsPermissions = async (): Promise<
  NotificationPermissionStatus | undefined
> => {
  return "denied";
};

export const loadSavedNotificationMessagesToContext = async () => {};

export const saveConversationIdentifiersForNotifications = (
  conversation: XmtpConversation
) => {};

export const onInteractWithNotification = (
  event: Notifications.NotificationResponse
) => {};

export const shouldShowNotificationForeground = async (
  notification: Notifications.Notification
) => {};

export const saveNotificationsStatus = async () => {};

export const resetNotifications = async (
  timeout: number = 0
): Promise<void> => {};
