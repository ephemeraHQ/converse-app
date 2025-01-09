import * as Notifications from "expo-notifications";

import { savePushToken } from "@utils/keychain/helpers";
import logger from "@utils/logger";

import { ConversationWithCodecsType } from "@/utils/xmtpRN/client.types";
import { useAppStore } from "@data/store/appStore";
import { saveNotificationsSubscribe } from "@utils/api";
import { requestPushNotificationsPermissions } from "./requestPushNotificationsPermissions";
import { InboxId } from "@xmtp/react-native-sdk";
import { getXmtpClientOrThrow } from "@/features/Accounts/accounts.utils";
import { subscribingByInboxId } from "./subscribingByAccount";

let nativePushToken: string | null;

const buildUserV3InviteTopic = (account: string): string => {
  return `/xmtp/mls/1/w-${account}/proto`;
};

type SubscribeToNotificationsParams = {
  conversations: ConversationWithCodecsType[];
  inboxId: InboxId;
};

export const subscribeToNotifications = async ({
  conversations,
  inboxId,
}: SubscribeToNotificationsParams): Promise<void> => {
  try {
    logger.info(
      "[subscribeToNotifications] start",
      inboxId,
      conversations.length
    );
    const thirtyDayPeriodsSinceEpoch = Math.floor(
      Date.now() / 1000 / 60 / 60 / 24 / 30
    );
    const client = getXmtpClientOrThrow({
      inboxId,
      caller: "subscribeToNotifications",
    });
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
      delete subscribingByInboxId[inboxId];
      return;
    }
    const userGroupInviteTopic = buildUserV3InviteTopic(
      client.installationId || ""
    );
    topicsToUpdateForPeriod[userGroupInviteTopic] = {
      status: "PUSH",
    };

    logger.info(
      `[subscribeToNotifications] saving notifications subscribed to ${Object.keys(topicsToUpdateForPeriod).length} topics for Inbox ID ${inboxId}`
    );
    await saveNotificationsSubscribe({
      inboxId,
      nativeToken: nativePushToken,
      nativeTokenType: nativeTokenQuery.type,
      notificationChannel:
        nativeTokenQuery.type === "android" ? "converse-notifications" : null,
      topicsWithKeys: topicsToUpdateForPeriod,
    });
  } catch (e) {
    logger.error(e, {
      context:
        "[subscribeToNotifications] Error while subscribing to notifications",
    });
  }
};
