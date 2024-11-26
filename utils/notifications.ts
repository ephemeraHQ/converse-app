import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { ConversationId, ConversationTopic } from "@xmtp/react-native-sdk";
import { currentAccount, useAccountsStore } from "../data/store/accountsStore";
import { useAppStore } from "../data/store/appStore";
import api, { saveNotificationsSubscribe } from "./api";
import { getTopicFromV3Id } from "./groupUtils/groupId";
import mmkv from "./mmkv";
import { navigate, navigateToTopic } from "./navigation";
import { getXmtpClient } from "./xmtpRN/sync";
import {
  ConversationWithCodecsType,
  ConverseXmtpClientType,
} from "./xmtpRN/client";
import logger from "./logger";
import { savePushToken } from "./keychain/helpers";

let nativePushToken: string | null;

export type NotificationPermissionStatus =
  | "granted"
  | "undetermined"
  | "denied";

const subscribingByAccount: { [account: string]: boolean } = {};
const subscribedOnceByAccount: { [account: string]: boolean } = {};

const buildUserV3InviteTopic = (installationId: string): string => {
  return `/xmtp/mls/1/w-${installationId}/proto`;
};

export const deleteSubscribedTopics = (account: string) => {
  if (account in subscribedOnceByAccount) {
    delete subscribedOnceByAccount[account];
  }
  if (account in subscribingByAccount) {
    delete subscribingByAccount[account];
  }
};

export const lastNotifSubscribeByAccount: {
  [account: string]: {
    stringToHash?: string | undefined;
    serverHash?: string | undefined;
  };
} = {};

type SubscribeToNotificationsParams = {
  conversations: ConversationWithCodecsType[];
  account: string;
};

export const subscribeToNotifications = async ({
  conversations,
  account,
}: SubscribeToNotificationsParams): Promise<void> => {
  try {
    logger.info(
      "[subscribeToNotifications] start",
      account,
      conversations.length
    );
    const thirtyDayPeriodsSinceEpoch = Math.floor(
      Date.now() / 1000 / 60 / 60 / 24 / 30
    );
    const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
    if (!client) {
      logger.error("[subscribeToNotifications] no client");
      return;
    }
    logger.info("[subscribeToNotifications] client exists");
    const notificationsPermissionStatus =
      useAppStore.getState().notificationsPermissionStatus;
    logger.info(
      "[subscribeToNotifications] notificationsPermissionStatus",
      notificationsPermissionStatus
    );
    if (notificationsPermissionStatus !== "granted") {
      const newStatus = await requestPushNotificationsPermissions();
      logger.info(
        "[subscribeToNotifications] notificationsPermissionStatus new status",
        newStatus
      );
      if (newStatus !== "granted") return;
    }

    const topicsToUpdateForPeriod: {
      [topic: string]: {
        status: "PUSH" | "MUTED";
        hmacKeys?: any;
      };
    } = {};
    const dataToHash = {
      push: [] as string[],
      muted: [] as string[],
      period: thirtyDayPeriodsSinceEpoch,
    };
    for (const conversation of conversations) {
      const topic = conversation.topic;
      const conversationState = conversation.state;
      if (conversationState === "allowed") {
        dataToHash.push.push(topic);
        topicsToUpdateForPeriod[topic] = {
          status: "PUSH",
        };
      }
    }
    logger.info("[subscribeToNotifications] getting native push token");
    const nativeTokenQuery = await Notifications.getDevicePushTokenAsync();
    nativePushToken = nativeTokenQuery.data;
    if (nativePushToken) {
      savePushToken(nativePushToken);
    } else {
      logger.error("[subscribeToNotifications] no native push token");
      delete subscribingByAccount[account];
      return;
    }
    const userGroupInviteTopic = buildUserV3InviteTopic(
      client.installationId || ""
    );
    topicsToUpdateForPeriod[userGroupInviteTopic] = {
      status: "PUSH",
    };

    logger.info("[subscribeToNotifications] saving notifications subscribe");
    await saveNotificationsSubscribe(
      account,
      nativePushToken,
      nativeTokenQuery.type,
      nativeTokenQuery.type === "android" ? "converse-notifications" : null,
      topicsToUpdateForPeriod
    );
  } catch (e) {
    logger.error(e, {
      context:
        "[subscribeToNotifications] Error while subscribing to notifications",
    });
  }
};

export const unsubscribeFromNotifications = async (apiHeaders: {
  [key: string]: string;
}): Promise<void> => {
  // Add a 5 sec timeout so not to block us ?
  const nativeTokenQuery = (await Promise.race([
    Notifications.getDevicePushTokenAsync(),
    new Promise((res) => setTimeout(() => res(undefined), 5000)),
  ])) as any;
  if (nativeTokenQuery?.data) {
    await api.post(
      "/api/unsubscribe",
      {
        nativeToken: nativeTokenQuery.data,
      },
      { headers: apiHeaders }
    );
  }
};

const setupAndroidNotificationChannel = async () => {
  if (Platform.OS !== "android") return;

  // Delete legacy default channel
  await Notifications.deleteNotificationChannelAsync("default");

  // Create new channel and showBadge set to true
  await Notifications.setNotificationChannelAsync("converse-notifications", {
    name: "Converse Notifications",
    importance: Notifications.AndroidImportance.MAX,
    showBadge: true,
  });
};

const getNotificationsPermissionStatus = async (): Promise<
  NotificationPermissionStatus | undefined
> => {
  await setupAndroidNotificationChannel();

  const { status } = await Notifications.getPermissionsAsync();
  return status;
};

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

export const onInteractWithNotification = (
  event: Notifications.NotificationResponse
) => {
  let notificationData = event.notification.request.content.data;
  // Android returns the data in the body as a string
  if (
    notificationData &&
    typeof notificationData === "object" &&
    "body" in notificationData &&
    typeof notificationData["body"] === "string"
  ) {
    // @ts-ignore TODO
    notificationData = JSON.parse(notificationData.body);
  }
  // Handling for data/silent notifications
  if (!notificationData) {
    const payload =
      event.notification?.request.trigger &&
      typeof event.notification.request.trigger === "object" &&
      "payload" in event.notification.request.trigger
        ? event.notification.request.trigger.payload
        : undefined;
    if (!payload) {
      return;
    }
    const payloadType = payload["type"];
    if (payloadType === "group_join_request") {
      const groupId = payload["groupId"] as ConversationId;
      if (typeof groupId === "string") {
        return navigate("Group", {
          topic: getTopicFromV3Id(groupId),
        });
      } else {
        return;
      }
    }
  }
  const conversationTopic = notificationData["contentTopic"] as
    | string
    | undefined;
  const account =
    notificationData["account"] || useAccountsStore.getState().currentAccount;

  if (conversationTopic) {
    useAccountsStore.getState().setCurrentAccount(account, false);
    navigateToTopic(conversationTopic as ConversationTopic);
  }
};

export const shouldShowNotificationForeground = async (
  notification: Notifications.Notification
) => {
  resetNotifications();
  const account = notification.request.content.data?.["account"];
  if (account && account !== currentAccount()) {
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  } else {
    return {
      shouldShowAlert: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    };
  }
};

export const saveNotificationsStatus = async () => {
  const notificationsStatus = await getNotificationsPermissionStatus();
  if (
    notificationsStatus === "undetermined" ||
    notificationsStatus === "granted" ||
    notificationsStatus === "denied"
  ) {
    useAppStore
      .getState()
      .setNotificationsPermissionStatus(notificationsStatus);
  }
};

export const resetNotifications = async (
  timeout: number = 0
): Promise<void> => {
  setTimeout(async () => {
    await Notifications.dismissAllNotificationsAsync();
    await Notifications.setBadgeCountAsync(0);
    mmkv.set("notifications-badge", 0);
  }, timeout);
};

// This handler determines how the app handles
// notifications that come in while the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: shouldShowNotificationForeground,
});

// This handler determines how the app handles
// notifications that have been clicked on
Notifications.addNotificationResponseReceivedListener(
  onInteractWithNotification
);
