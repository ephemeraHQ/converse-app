import { createHash } from "@mfellner/react-native-fast-create-hash";
import { keystore } from "@xmtp/proto";
import { buildUserInviteTopic } from "@xmtp/xmtp-js";
import * as Notifications from "expo-notifications";
import { debounce } from "perfect-debounce";

import {
  ConversationWithLastMessagePreview,
  conversationShouldBeDisplayed,
  conversationShouldBeInInbox,
} from "@utils/conversation";
import { getGroupIdFromTopic } from "@utils/groupUtils/groupId";
import { savePushToken } from "@utils/keychain/helpers";
import logger from "@utils/logger";

import { ConverseXmtpClientType } from "@utils/xmtpRN/client";
import { loadConversationsHmacKeys } from "@utils/xmtpRN/conversations";
import { getXmtpClient } from "@utils/xmtpRN/sync";
import { saveConversationsLastNotificationSubscribePeriod } from "@data/helpers/conversations/upsertConversations";
import { getChatStore, getSettingsStore } from "@data/store/accountsStore";
import { useAppStore } from "@data/store/appStore";
import { lastNotifSubscribeByAccount } from "./lastNotifSubscribeByAccount";
import { subscribingByAccount } from "./subscribingByAccount";
import { subscribedOnceByAccount } from "./subscribedOnceByAccount";
import {
  getLastNotificationsSubscribeHash,
  saveNotificationsSubscribe,
} from "@utils/api";

let nativePushToken: string | null;

const buildUserGroupInviteTopic = (account: string): string => {
  return `/xmtp/mls/1/w-${account}/proto`;
};

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
