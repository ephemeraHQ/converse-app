import {
  buildUserInviteTopic,
  //@ts-ignore
} from "@xmtp/xmtp-js/dist/cjs/src/utils";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { XmtpConversation } from "../data/store/xmtpReducer";
import api from "./api";
import { saveExpoPushToken } from "./keychain";

let expoPushToken: string | null;

export type NotificationPermissionStatus =
  | "granted"
  | "undetermined"
  | "denied";

let lastSubscribedTopics: string[] = [];

export const subscribeToNotifications = async (
  address: string,
  conversations: XmtpConversation[],
  blockedPeerAddresses: { [peerAddress: string]: boolean }
): Promise<void> => {
  const topics = [
    ...conversations
      .filter(
        (c) =>
          c.peerAddress && !blockedPeerAddresses[c.peerAddress.toLowerCase()]
      )
      .map((c) => c.topic),
    buildUserInviteTopic(address || ""),
  ];
  const [expoTokenQuery, nativeTokenQuery] = await Promise.all([
    Notifications.getExpoPushTokenAsync(),
    Notifications.getDevicePushTokenAsync(),
  ]);
  expoPushToken = expoTokenQuery.data;
  saveExpoPushToken(expoPushToken);

  // Let's check if we need to make the query i.e
  // the topics are not exactly the same
  const shouldMakeQuery =
    lastSubscribedTopics.length !== topics.length ||
    topics.some((t) => !lastSubscribedTopics.includes(t));
  if (!shouldMakeQuery) return;
  lastSubscribedTopics = topics;
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

export const subscribeToNewTopic = async (topic: string): Promise<void> => {
  await Notifications.setNotificationChannelAsync("default", {
    name: "Converse Notifications",
    importance: Notifications.AndroidImportance.MAX,
    showBadge: false,
  });
  const expoTokenQuery = await Notifications.getExpoPushTokenAsync();
  expoPushToken = expoTokenQuery.data;
  try {
    await api.post("/api/subscribe/append", {
      expoToken: expoPushToken,
      topic,
    });
  } catch (e: any) {
    console.log("Could not subscribe to new topic");
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
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Converse Notifications",
      importance: Notifications.AndroidImportance.MAX,
      showBadge: false,
    });
  }
  const { status } = await Notifications.getPermissionsAsync();
  return status;
};

export const requestPushNotificationsPermissions = async (): Promise<
  NotificationPermissionStatus | undefined
> => {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Converse Notifications",
      importance: Notifications.AndroidImportance.MAX,
      showBadge: false,
    });
  }
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus;
};
