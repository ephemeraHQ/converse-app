import axios from "axios";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import config from "../config";

let expoPushToken: string | null;

const api = axios.create({
  baseURL: config.notificationsServerURI,
});

export type NotificationPermissionStatus =
  | "granted"
  | "undetermined"
  | "denied";

export const subscribeToNotifications = async (
  topics: string[]
): Promise<void> => {
  if (!Device.isDevice || Platform.OS === "web") return;
  const [expoTokenQuery, nativeTokenQuery] = await Promise.all([
    Notifications.getExpoPushTokenAsync(),
    Notifications.getDevicePushTokenAsync(),
  ]);
  expoPushToken = expoTokenQuery.data;
  await api.post("/api/subscribe", {
    expoToken: expoPushToken,
    nativeToken: nativeTokenQuery.data,
    nativeTokenType: nativeTokenQuery.type,
    topics,
  });
};

export const disablePushNotifications = async (): Promise<void> => {
  console.log("IN DISABLE", expoPushToken);
  if (expoPushToken) {
    try {
      console.log("CALLING DELETE");
      await api.delete(`/api/device/${encodeURIComponent(expoPushToken)}`);
    } catch (e: any) {
      console.error(e?.response);
    }
    expoPushToken = null;
  }
};

export const getNotificationsPermissionStatus = async (): Promise<
  NotificationPermissionStatus | undefined
> => {
  if (!Device.isDevice || Platform.OS === "web") return;
  const { status } = await Notifications.getPermissionsAsync();
  return status;
};

export const requestPushNotificationsPermissions = async (): Promise<
  NotificationPermissionStatus | undefined
> => {
  if (!Device.isDevice || Platform.OS === "web") return;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus;
};

// export const onNotificationReceived = (
//   callback: (event: Notifications.Notification) => void
// ) => Notifications.addNotificationReceivedListener(callback);

// export const onNotificationResponse = (
//   callback: (response: Notifications.NotificationResponse) => void
// ) => Notifications.addNotificationResponseReceivedListener(callback);

// export const setBadgeCount = (badgeCount: number): Promise<boolean> => {
//   return Notifications.setBadgeCountAsync(badgeCount);
// };
