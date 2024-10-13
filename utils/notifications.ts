import { createHash } from "@mfellner/react-native-fast-create-hash";
import { keystore } from "@xmtp/proto";
import { buildUserInviteTopic } from "@xmtp/xmtp-js";
import * as Notifications from "expo-notifications";
import { debounce } from "perfect-debounce";
import { Platform } from "react-native";

import api, {
  getLastNotificationsSubscribeHash,
  saveNotificationsSubscribe,
} from "./api";
import {
  ConversationWithLastMessagePreview,
  conversationShouldBeDisplayed,
  conversationShouldBeInInbox,
} from "./conversation";
import { getGroupIdFromTopic, getTopicFromGroupId } from "./groupUtils/groupId";
import { savePushToken } from "./keychain/helpers";
import logger from "./logger";
import mmkv from "./mmkv";
import {
  navigate,
  navigateToConversation,
  setTopicToNavigateTo,
} from "./navigation";
import {
  emptySavedNotificationsConversations,
  emptySavedNotificationsMessages,
  loadSavedNotificationsConversations,
  loadSavedNotificationsMessages,
} from "./sharedData";
import { ConverseXmtpClientType } from "./xmtpRN/client";
import { loadConversationsHmacKeys } from "./xmtpRN/conversations";
import { getXmtpClient } from "./xmtpRN/sync";
import {
  saveConversations,
  saveConversationsLastNotificationSubscribePeriod,
} from "../data/helpers/conversations/upsertConversations";
import { saveMessages } from "../data/helpers/messages";
import {
  currentAccount,
  getAccountsList,
  getChatStore,
  getProfilesStore,
  getSettingsStore,
  useAccountsStore,
} from "../data/store/accountsStore";
import { useAppStore } from "../data/store/appStore";
import { XmtpMessage } from "../data/store/chatStore";

let nativePushToken: string | null;

export type NotificationPermissionStatus =
  | "granted"
  | "undetermined"
  | "denied";

const subscribingByAccount: { [account: string]: boolean } = {};
const subscribedOnceByAccount: { [account: string]: boolean } = {};

const buildUserGroupInviteTopic = (account: string): string => {
  return `/xmtp/mls/1/w-${account}/proto`;
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

const _subscribeToNotifications = async (account: string): Promise<void> => {
  const thirtyDayPeriodsSinceEpoch = Math.floor(
    Date.now() / 1000 / 60 / 60 / 24 / 30
  );
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  if (!client) {
    return;
  }
  const { conversations, conversationsSortedOnce, topicsData } =
    getChatStore(account).getState();
  const notificationsPermissionStatus =
    useAppStore.getState().notificationsPermissionStatus;
  if (notificationsPermissionStatus !== "granted") return;
  if (subscribingByAccount[account] || !conversationsSortedOnce) {
    await new Promise((r) => setTimeout(r, 1000));
    logger.debug("Resubscribing to notifications in 1sec");
    await _subscribeToNotifications(account);
    return;
  }
  try {
    subscribingByAccount[account] = true;

    const { peersStatus, groupStatus } = getSettingsStore(account).getState();

    const isBlocked = (peerAddress: string) =>
      peersStatus[peerAddress.toLowerCase()] === "blocked";

    const isGroupBlocked = (groupId: string) =>
      peersStatus[groupId] === "blocked";

    const needToUpdateConversationSubscription = (
      c: ConversationWithLastMessagePreview
    ) => {
      const hasValidPeer = c.peerAddress || c.isGroup;
      const isPending = !!c.pending;

      if (!hasValidPeer || isPending) {
        return {
          topic: c.topic,
          update: false,
        };
      }

      const isNotBlocked = c.peerAddress
        ? !isBlocked(c.peerAddress)
        : !isGroupBlocked(getGroupIdFromTopic(c.topic));
      const isTopicNotDeleted = topicsData[c.topic]?.status !== "deleted";
      const isTopicInInbox =
        conversationShouldBeDisplayed(c, topicsData) &&
        conversationShouldBeInInbox(c, peersStatus, groupStatus);

      const status =
        isNotBlocked && isTopicNotDeleted && isTopicInInbox ? "PUSH" : "MUTED";
      const period = status === "PUSH" ? thirtyDayPeriodsSinceEpoch : -1;

      return {
        topic: c.topic,
        // update: period !== c.lastNotificationsSubscribedPeriod,
        update: true,
        status,
        period,
      };
    };

    const topicsToUpdateForPeriod: {
      [topic: string]: {
        status: "PUSH" | "MUTED";
        hmacKeys?: any;
      };
    } = {};

    const conversationTopicsToUpdate = Object.values(conversations)
      .map(needToUpdateConversationSubscription)
      .filter((n) => n.update);

    const dataToHash = {
      push: [] as string[],
      muted: [] as string[],
      period: thirtyDayPeriodsSinceEpoch,
    };

    if (conversationTopicsToUpdate.length > 0) {
      const conversationsKeys = await loadConversationsHmacKeys(account);
      conversationTopicsToUpdate.forEach((c) => {
        if (c.status === "PUSH") {
          dataToHash.push.push(c.topic);
        } else {
          dataToHash.muted.push(c.topic);
        }
        if (conversationsKeys[c.topic]) {
          const hmacKeys =
            keystore.GetConversationHmacKeysResponse_HmacKeys.toJSON(
              conversationsKeys[c.topic]
            );
          topicsToUpdateForPeriod[c.topic] = {
            status: c.status as "PUSH" | "MUTED",
            hmacKeys,
          };
        } else {
          topicsToUpdateForPeriod[c.topic] = {
            status: c.status as "PUSH" | "MUTED",
          };
        }
      });
    } else if (subscribedOnceByAccount[account]) {
      delete subscribingByAccount[account];
      // No need to even make a query for invite topic if we already did!
      return;
    }

    const nativeTokenQuery = await Notifications.getDevicePushTokenAsync();
    nativePushToken = nativeTokenQuery.data;
    if (nativePushToken) {
      savePushToken(nativePushToken);
    } else {
      delete subscribingByAccount[account];
      return;
    }

    const userInviteTopic = buildUserInviteTopic(account || "");
    topicsToUpdateForPeriod[userInviteTopic] = {
      status: "PUSH",
    };
    dataToHash.push.push(userInviteTopic);
    const userGroupInviteTopic = buildUserGroupInviteTopic(
      client.installationId || ""
    );
    topicsToUpdateForPeriod[userGroupInviteTopic] = {
      status: "PUSH",
    };
    dataToHash.push.push(userGroupInviteTopic);
    dataToHash.push.sort();
    dataToHash.muted.sort();
    const stringToHash = `${dataToHash.period}-push-${dataToHash.push.join(
      ","
    )}-muted-${dataToHash.muted.join(",")}`;

    lastNotifSubscribeByAccount[account] =
      lastNotifSubscribeByAccount[account] || {};
    const lastStringToHash = lastNotifSubscribeByAccount[account]?.stringToHash;

    if (stringToHash === lastStringToHash) {
      delete subscribingByAccount[account];
      return;
    }

    const hash = (
      await createHash(Buffer.from(stringToHash), "sha256")
    ).toString("hex");

    if (!lastNotifSubscribeByAccount[account]?.serverHash) {
      lastNotifSubscribeByAccount[account].serverHash =
        await getLastNotificationsSubscribeHash(account, nativePushToken);
    }

    if (
      lastNotifSubscribeByAccount[account] &&
      lastNotifSubscribeByAccount[account]?.serverHash === hash
    ) {
      lastNotifSubscribeByAccount[account].stringToHash = stringToHash;
      // We're already up to date!
      delete subscribingByAccount[account];
      return;
    }

    logger.info(
      `[Notifications] Subscribing to ${
        Object.keys(topicsToUpdateForPeriod).length
      } topic for ${account}`
    );

    lastNotifSubscribeByAccount[account].serverHash =
      await saveNotificationsSubscribe(
        account,
        nativePushToken,
        nativeTokenQuery.type,
        nativeTokenQuery.type === "android" ? "converse-notifications" : null,
        topicsToUpdateForPeriod
      );
    // Also saved the hashed string so we don't hash it again with no reason
    lastNotifSubscribeByAccount[account].stringToHash = stringToHash;

    // Topics updated have a period
    const updated = Object.keys(topicsToUpdateForPeriod).filter(
      (topic) =>
        topicsToUpdateForPeriod[topic].status === "PUSH" &&
        topicsToUpdateForPeriod[topic].hmacKeys
    );

    // Topics deleted have a period of -1
    const deleted = Object.keys(topicsToUpdateForPeriod).filter(
      (topic) => topicsToUpdateForPeriod[topic].status === "MUTED"
    );

    await saveConversationsLastNotificationSubscribePeriod(
      account,
      updated,
      thirtyDayPeriodsSinceEpoch
    );
    await saveConversationsLastNotificationSubscribePeriod(
      account,
      deleted,
      -1
    );

    subscribedOnceByAccount[account] = true;
  } catch (e) {
    logger.error(e, { context: "Error while subscribing to notifications" });
  }
  delete subscribingByAccount[account];
};

// Don't call twice in 1 sec
export const subscribeToNotifications = debounce(
  _subscribeToNotifications,
  1000
);

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
  try {
    const knownAccounts = getAccountsList();
    const conversations = loadSavedNotificationsConversations();
    const messages = loadSavedNotificationsMessages();

    if (conversations && conversations.length > 0) {
      logger.debug(
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
      for (const account in conversationsToSaveByAccount) {
        await saveConversations(
          account,
          conversationsToSaveByAccount[account],
          true
        );
      }
    }

    if (messages && messages.length > 0) {
      messages.sort((m1: any, m2: any) => m1.sent - m2.sent);
      logger.debug(
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
            status: "delivered",
            contentType: message.contentType || "xmtp.org/text:1.0",
            topic: message.topic,
            referencedMessageId: message.referencedMessageId,
          });
        }
      });

      const promises: Promise<void>[] = [];

      for (const account in messagesToSaveByAccount) {
        promises.push(saveMessages(account, messagesToSaveByAccount[account]));
      }
      await Promise.all(promises);
      for (const account in messagesToSaveByAccount) {
        // Refreshing profiles store from mmkv
        // as we could have added data from notification
        getProfilesStore(account).getState().refreshFromStorage();
      }
    }

    emptySavedNotificationsConversations();
    emptySavedNotificationsMessages();
    loadingSavedNotifications = false;
  } catch (e) {
    logger.error(e, {
      error: "An error occured while loading saved notifications",
      errorType: typeof e,
    });

    emptySavedNotificationsConversations();
    emptySavedNotificationsMessages();
    loadingSavedNotifications = false;
  }
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
      const groupId = payload["groupId"] as string;
      if (typeof groupId === "string") {
        return navigate("Group", {
          topic: getTopicFromGroupId(groupId),
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
