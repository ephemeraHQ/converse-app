import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { setTopicToNavigateTo } from "../components/StateHandlers/InitialStateHandler";
import config from "../config";
import { saveConversations } from "../data/helpers/conversations/upsertConversations";
import { saveMessages } from "../data/helpers/messages";
import { getAccountsList, useChatStore } from "../data/store/accountsStore";
import { useAppStore } from "../data/store/appStore";
import { XmtpConversation, XmtpMessage } from "../data/store/chatStore";
import { buildUserInviteTopic } from "../vendor/xmtp-js/src/utils";
import api from "./api";
import { saveExpoPushToken } from "./keychain";
import { navigateToConversation } from "./navigation";
import { sentryTrackError, sentryTrackMessage } from "./sentry";
import {
  emptySavedNotificationsMessages,
  loadSavedNotificationsMessages,
  emptySavedNotificationsConversations,
  loadSavedNotificationsConversations,
  saveConversationDict,
} from "./sharedData/sharedData";
import { conversationName, shortAddress } from "./str";

let expoPushToken: string | null;

export type NotificationPermissionStatus =
  | "granted"
  | "undetermined"
  | "denied";

let lastSubscribedTopics: string[] = [];

export const subscribeToNotifications = async (
  address: string,
  conversations: XmtpConversation[],
  blockedPeerAddresses: { [peerAddress: string]: boolean },
  deletedTopics: { [topic: string]: boolean }
): Promise<void> => {
  const topics = [
    ...conversations
      .filter(
        (c) =>
          c.peerAddress &&
          !c.pending &&
          !blockedPeerAddresses[c.peerAddress.toLowerCase()] &&
          !deletedTopics[c.topic]
      )
      .map((c) => c.topic),
    buildUserInviteTopic(address || ""),
  ];
  const [expoTokenQuery, nativeTokenQuery] = await Promise.all([
    Notifications.getExpoPushTokenAsync({ projectId: config.expoProjectId }),
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
  try {
    await api.post("/api/subscribe", {
      expoToken: expoPushToken,
      nativeToken: nativeTokenQuery.data,
      nativeTokenType: nativeTokenQuery.type,
      topics,
    });
    lastSubscribedTopics = topics;
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

let loadingSavedNotifications = false;

const waitForLoadingSavedNotifications = async () => {
  if (!loadingSavedNotifications) return;
  await new Promise((r) => setTimeout(r, 100));
  await waitForLoadingSavedNotifications();
};

export const loadSavedNotificationMessagesToContext = async () => {
  if (loadingSavedNotifications) {
    await waitForLoadingSavedNotifications();
    return;
  }
  loadingSavedNotifications = true;
  let lastStepDone = 0;
  try {
    const knownAccounts = getAccountsList();
    lastStepDone = 1;
    const [conversations, messages] = await Promise.all([
      loadSavedNotificationsConversations(),
      loadSavedNotificationsMessages(),
    ]);
    lastStepDone = 2;
    await Promise.all([
      emptySavedNotificationsConversations(),
      emptySavedNotificationsMessages(),
    ]);
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
          });
        }
      });
      lastStepDone = 5;
      for (const account of Object.keys(conversationsToSaveByAccount)) {
        await saveConversations(account, conversationsToSaveByAccount[account]);
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
        [account: string]: { [topic: string]: XmtpMessage[] };
      } = {};
      messages.forEach((message: any) => {
        if (message.account && knownAccounts.includes(message.account)) {
          messagesToSaveByAccount[message.account] =
            messagesToSaveByAccount[message.account] || {};
          messagesToSaveByAccount[message.account][message.topic] =
            messagesToSaveByAccount[message.account][message.topic] || [];
          messagesToSaveByAccount[message.account][message.topic].push({
            id: message.id,
            senderAddress: message.senderAddress,
            sent: message.sent,
            content: message.content,
            status: "sent",
            sentViaConverse: !!message.sentViaConverse,
            contentType: message.contentType || "xmtp.org/text:1.0",
          });
        }
      });
      lastStepDone = 9;

      const promises: Promise<void>[] = [];

      for (const account of Object.keys(messagesToSaveByAccount)) {
        for (const topic of Object.keys(messagesToSaveByAccount[account])) {
          promises.push(
            saveMessages(
              account,
              messagesToSaveByAccount[account][topic],
              topic
            )
          );
        }
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
  saveConversationDict(conversation.topic, conversationDict).catch((e) => {
    const dataToSave = {
      topic: `conversation-${conversation.topic}`,
      conversationDict,
    };
    sentryTrackMessage("ERROR_SAVING_SHARED_PREFERENCE", {
      error: e.toString(),
      data: JSON.stringify(dataToSave),
    });
  });
};

export const onInteractWithNotification = (
  event: Notifications.NotificationResponse
) => {
  const notificationData = event.notification.request.content.data;
  if (!notificationData) return;
  const newConversationTopic = notificationData["newConversationTopic"] as
    | string
    | undefined;
  const messageConversationTopic = notificationData["contentTopic"] as
    | string
    | undefined;
  const conversationTopic = newConversationTopic || messageConversationTopic;
  if (conversationTopic) {
    const conversations = useChatStore.getState().conversations;
    if (conversations[conversationTopic]) {
      navigateToConversation(conversations[conversationTopic]);
    } else {
      // App was probably not loaded!
      setTopicToNavigateTo(conversationTopic);
    }
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
