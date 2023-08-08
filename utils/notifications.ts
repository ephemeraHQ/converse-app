import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import config from "../config";
import { saveConversations } from "../data/helpers/conversations/upsertConversations";
import { saveMessages } from "../data/helpers/messages";
import { XmtpConversation } from "../data/store/chatStore";
import { buildUserInviteTopic } from "../vendor/xmtp-js/src/utils";
import api from "./api";
import { saveExpoPushToken } from "./keychain";
import { sentryTrackMessage } from "./sentry";
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
  blockedPeerAddresses: { [peerAddress: string]: boolean }
): Promise<void> => {
  const topics = [
    ...conversations
      .filter(
        (c) =>
          c.peerAddress &&
          !c.pending &&
          !blockedPeerAddresses[c.peerAddress.toLowerCase()]
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
  const expoTokenQuery = await Notifications.getExpoPushTokenAsync({
    projectId: config.expoProjectId,
  });
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
  try {
    const conversations = await loadSavedNotificationsConversations();
    await emptySavedNotificationsConversations();
    const conversationsToSave = conversations.map((c: any) => {
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
      return {
        topic: c.topic,
        peerAddress: c.peerAddress,
        createdAt: c.createdAt,
        readUntil: 0,
        pending: false,
        context,
      };
    });
    await saveConversations(conversationsToSave);

    const messages = await loadSavedNotificationsMessages();
    await emptySavedNotificationsMessages();
    messages.sort((m1: any, m2: any) => m1.sent - m2.sent);
    await Promise.all(
      messages.map((message: any) =>
        saveMessages(
          [
            {
              id: message.id,
              senderAddress: message.senderAddress,
              sent: message.sent,
              content: message.content,
              status: "sent",
              sentViaConverse: !!message.sentViaConverse,
              contentType: message.contentType || "xmtp.org/text:1.0",
            },
          ],
          message.topic
        )
      )
    );

    loadingSavedNotifications = false;
  } catch (e) {
    console.log("An error occured while loading saved notifications", e);
    emptySavedNotificationsMessages();
    emptySavedNotificationsConversations();
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
