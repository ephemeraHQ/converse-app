import { buildUserInviteTopic } from "@xmtp/xmtp-js";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import config from "../config";
import { saveConversations } from "../data/helpers/conversations/upsertConversations";
import { saveMessages } from "../data/helpers/messages";
import {
  currentAccount,
  getAccountsList,
  getChatStore,
  getSettingsStore,
  useAccountsStore,
} from "../data/store/accountsStore";
import { useAppStore } from "../data/store/appStore";
import { XmtpConversation, XmtpMessage } from "../data/store/chatStore";
import api from "./api";
import { savePushToken } from "./keychain/helpers";
import mmkv from "./mmkv";
import { navigateToConversation, setTopicToNavigateTo } from "./navigation";
import { sentryTrackError } from "./sentry";
import {
  emptySavedNotificationsMessages,
  loadSavedNotificationsMessages,
  emptySavedNotificationsConversations,
  loadSavedNotificationsConversations,
  saveConversationDict,
} from "./sharedData";
import { conversationName, shortAddress } from "./str";
import { getXmtpApiHeaders } from "./xmtpRN/api";

let expoPushToken: string | null;
let nativePushToken: string | null;

export type NotificationPermissionStatus =
  | "granted"
  | "undetermined"
  | "denied";

const lastSubscribedTopicsByAccount: { [account: string]: string[] } = {};
const subscribingByAccount: { [account: string]: boolean } = {};

export const deleteSubscribedTopics = (account: string) => {
  if (account in lastSubscribedTopicsByAccount) {
    delete lastSubscribedTopicsByAccount[account];
  }
  if (account in subscribingByAccount) {
    delete subscribingByAccount[account];
  }
};

export const subscribeToNotifications = async (
  account: string
): Promise<void> => {
  if (Platform.OS === "web") return;
  const {
    sortedConversationsWithPreview,
    topicsStatus,
    conversationsSortedOnce,
  } = getChatStore(account).getState();
  if (subscribingByAccount[account] || !conversationsSortedOnce) {
    await new Promise((r) => setTimeout(r, 1000));
    await subscribeToNotifications(account);
    return;
  }
  try {
    subscribingByAccount[account] = true;
    const lastSubscribedTopics = lastSubscribedTopicsByAccount[account] || [];

    const { peersStatus } = getSettingsStore(account).getState();

    const isBlocked = (peerAddress: string) =>
      peersStatus[peerAddress.toLowerCase()] === "blocked";

    const isValidConversation = (c: any) => {
      const hasValidAddress = c.peerAddress;
      const isNotPending = !c.pending;
      const isNotBlocked = !isBlocked(c.peerAddress);
      const isTopicNotDeleted = topicsStatus[c.topic] !== "deleted";

      return (
        hasValidAddress && isNotPending && isNotBlocked && isTopicNotDeleted
      );
    };

    const topics = [
      ...Object.values(sortedConversationsWithPreview.conversationsInbox)
        .filter(isValidConversation)
        .map((c) => c.topic),
      buildUserInviteTopic(account || ""),
    ];

    const [expoTokenQuery, nativeTokenQuery] = await Promise.all([
      Notifications.getExpoPushTokenAsync({ projectId: config.expoProjectId }),
      Notifications.getDevicePushTokenAsync(),
    ]);
    expoPushToken = expoTokenQuery.data;
    nativePushToken = nativeTokenQuery.data;
    if (nativePushToken) {
      savePushToken(nativePushToken);
    }

    // Let's check if we need to make the query i.e
    // the topics are not exactly the same
    const shouldMakeQuery =
      lastSubscribedTopics.length !== topics.length ||
      topics.some((t) => !lastSubscribedTopics.includes(t));
    if (!shouldMakeQuery) {
      delete subscribingByAccount[account];
      return;
    }
    console.log(
      `[Notifications] Subscribing to ${topics.length} topic for ${account}`
    );
    await api.post(
      "/api/subscribe",
      {
        expoToken: expoPushToken,
        nativeToken: nativePushToken,
        nativeTokenType: nativeTokenQuery.type,
        notificationChannel:
          nativeTokenQuery.type === "android" ? "converse-notifications" : null,
        topics,
      },
      { headers: await getXmtpApiHeaders(account) }
    );
    lastSubscribedTopicsByAccount[account] = topics;
  } catch (e) {
    console.log("[Notifications] Error while subscribing:", e);
  }
  delete subscribingByAccount[account];
};

export const unsubscribeFromNotifications = async (apiHeaders: {
  [key: string]: string;
}): Promise<void> => {
  const nativeTokenQuery = await Notifications.getDevicePushTokenAsync();
  if (nativeTokenQuery.data) {
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

let loadingSavedNotifications = false;

const waitForLoadingSavedNotifications = async () => {
  if (!loadingSavedNotifications) return;
  await new Promise((r) => setTimeout(r, 100));
  await waitForLoadingSavedNotifications();
};

export const loadSavedNotificationMessagesToContext = async () => {
  if (loadingSavedNotifications) {
    await waitForLoadingSavedNotifications();
  }
  loadingSavedNotifications = true;
  let lastStepDone = 0;
  try {
    const knownAccounts = getAccountsList();
    lastStepDone = 1;
    const conversations = loadSavedNotificationsConversations();
    const messages = loadSavedNotificationsMessages();
    lastStepDone = 2;
    emptySavedNotificationsConversations();
    emptySavedNotificationsMessages();
    lastStepDone = 3;

    if (conversations && conversations.length > 0) {
      lastStepDone = 4;
      console.log(
        `Got ${conversations.length} new conversations from notifications:`,
        conversations
      );
      const conversationsToSaveByAccount: {
        [account: string]: any[];
      } = {};
      conversations.forEach((c: any) => {
        let context = undefined;
        // If conversationId is empty string we require at least some metadata…
        if (
          c.context &&
          (c.context.conversationId ||
            (c.context.metadata && Object.keys(c.context.metadata).length > 0))
        ) {
          context = {
            conversationId: c.context.conversationId,
            metadata: c.context.metadata,
          };
        }
        if (c.account && knownAccounts.includes(c.account)) {
          conversationsToSaveByAccount[c.account] =
            conversationsToSaveByAccount[c.account] || [];
          conversationsToSaveByAccount[c.account].push({
            topic: c.topic,
            peerAddress: c.peerAddress,
            createdAt: c.createdAt,
            readUntil: 0,
            pending: false,
            context,
            spamScore: c.spamScore,
          });
        }
      });
      lastStepDone = 5;
      for (const account in conversationsToSaveByAccount) {
        await saveConversations(
          account,
          conversationsToSaveByAccount[account],
          true
        );
      }
      lastStepDone = 6;
    }
    lastStepDone = 7;

    if (messages && messages.length > 0) {
      lastStepDone = 8;
      messages.sort((m1: any, m2: any) => m1.sent - m2.sent);
      console.log(
        `Got ${messages.length} new messages from notifications:`,
        messages
      );
      const messagesToSaveByAccount: {
        [account: string]: XmtpMessage[];
      } = {};
      messages.forEach((message: any) => {
        if (message.account && knownAccounts.includes(message.account)) {
          messagesToSaveByAccount[message.account] =
            messagesToSaveByAccount[message.account] || [];
          messagesToSaveByAccount[message.account].push({
            id: message.id,
            senderAddress: message.senderAddress,
            sent: message.sent,
            content: message.content,
            status: "sent",
            sentViaConverse: !!message.sentViaConverse,
            contentType: message.contentType || "xmtp.org/text:1.0",
            topic: message.topic,
          });
        }
      });
      lastStepDone = 9;

      const promises: Promise<void>[] = [];

      for (const account in messagesToSaveByAccount) {
        promises.push(saveMessages(account, messagesToSaveByAccount[account]));
      }
      lastStepDone = 10;
      await Promise.all(promises);
      lastStepDone = 11;
    }

    loadingSavedNotifications = false;
  } catch (e) {
    console.log("An error occured while loading saved notifications", e);
    sentryTrackError(e, {
      error: "An error occured while loading saved notifications",
      errorType: typeof e,
      lastStepDone,
    });
    emptySavedNotificationsConversations();
    emptySavedNotificationsMessages();
    loadingSavedNotifications = false;
  }
};

export const saveConversationIdentifiersForNotifications = (
  conversation: XmtpConversation
) => {
  const conversationDict: any = {
    peerAddress: conversation.peerAddress,
    shortAddress: shortAddress(conversation.peerAddress),
    title: conversationName(conversation),
  };

  // Also save to shared preferences to be able to show notification
  saveConversationDict(conversation.topic, conversationDict);
};

export const onInteractWithNotification = (
  event: Notifications.NotificationResponse
) => {
  const notificationData = event.notification.request.content.data;
  if (!notificationData) return;
  const conversationTopic = notificationData["contentTopic"] as
    | string
    | undefined;

  const account =
    notificationData["account"] || useAccountsStore.getState().currentAccount;

  if (conversationTopic) {
    useAccountsStore.getState().setCurrentAccount(account, false);
    const conversations = getChatStore(account).getState().conversations;

    if (conversations[conversationTopic]) {
      navigateToConversation(conversations[conversationTopic]);
    } else {
      // App was probably not loaded!
      setTopicToNavigateTo(conversationTopic);
    }
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
  if (Platform.OS === "web") return;
  setTimeout(async () => {
    await Notifications.dismissAllNotificationsAsync();
    await Notifications.setBadgeCountAsync(0);
    mmkv.set("notifications-badge", 0);
  }, timeout);
};
