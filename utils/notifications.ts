import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import uuid from "react-native-uuid";

import { DispatchType } from "../data/store/context";
import { XmtpDispatchTypes } from "../data/store/xmtpReducer";
import api from "./api";
import {
  emptySavedNotificationsMessages,
  loadSavedNotificationsMessages,
} from "./sharedData";

let expoPushToken: string | null;

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
  try {
    await api.post("/api/subscribe", {
      expoToken: expoPushToken,
      nativeToken: nativeTokenQuery.data,
      nativeTokenType: nativeTokenQuery.type,
      topics,
    });
  } catch (e: any) {
    console.log("Could not subscribe to notifications");
    console.log(e?.message);
  }
};

export const disablePushNotifications = async (): Promise<void> => {
  if (expoPushToken) {
    try {
      await api.delete(`/api/device/${encodeURIComponent(expoPushToken)}`);
    } catch (e: any) {
      console.log("Could not unsubscribe from notifications");
      console.error(e);
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

let loadingSavedNotifications = false;

const waitForLoadingSavedNotifications = async () => {
  if (!loadingSavedNotifications) return;
  await new Promise((r) => setTimeout(r, 100));
  await waitForLoadingSavedNotifications();
};

export const loadSavedNotificationMessagesToContext = async (
  dispatch: DispatchType
) => {
  if (loadingSavedNotifications) {
    await waitForLoadingSavedNotifications();
    return;
  }
  loadingSavedNotifications = true;
  const messages = await loadSavedNotificationsMessages();
  await emptySavedNotificationsMessages();
  messages.sort((m1: any, m2: any) => m1.sent - m2.sent);
  messages.forEach((message: any) => {
    dispatch({
      type: XmtpDispatchTypes.XmtpLazyMessage,
      payload: {
        topic: message.topic,
        message: {
          id: message.id || uuid.v4().toString(),
          senderAddress: message.senderAddress,
          sent: message.sent,
          content: message.content,
        },
      },
    });
  });
  loadingSavedNotifications = false;
};
