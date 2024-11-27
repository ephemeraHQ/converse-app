import * as Notifications from "expo-notifications";
import type { NotificationPermissionStatus } from "../types/Notifications.types";
import { setupAndroidNotificationChannel } from "./setupAndroidNotificationChannel";

export const getNotificationsPermissionStatus = async (): Promise<
  NotificationPermissionStatus | undefined
> => {
  await setupAndroidNotificationChannel();

  const { status } = await Notifications.getPermissionsAsync();
  return status;
};
