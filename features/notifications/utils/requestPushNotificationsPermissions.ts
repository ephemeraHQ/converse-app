import { NotificationPermissionStatus } from "../types/Notifications.types";
import { setupAndroidNotificationChannel } from "./setupAndroidNotificationChannel";
import * as Notifications from "expo-notifications";

export const requestPushNotificationsPermissions = async (): Promise<
  NotificationPermissionStatus | undefined
> => {
  await setupAndroidNotificationChannel();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus;
};
