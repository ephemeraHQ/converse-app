import * as Notifications from "expo-notifications";

import { savePushToken } from "@utils/keychain/helpers";
import logger from "@utils/logger";

import { saveNotificationsSubscribe } from "@/utils/api/notifications";
import { getXmtpClient } from "@/utils/xmtpRN/xmtp-client/xmtp-client";
import { ConversationWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { useAppStore } from "@data/store/appStore";
import { requestPushNotificationsPermissions } from "./requestPushNotificationsPermissions";
import { subscribingByAccount } from "./subscribingByAccount";

let nativePushToken: string | null;

const buildUserV3InviteTopic = (account: string): string => {
  return `/xmtp/mls/1/w-${account}/proto`;
};

type SubscribeToNotificationsParams = {
  conversations: ConversationWithCodecsType[];
  account: string;
};

export const subscribeToNotifications = async ({
  conversations,
  account,
}: SubscribeToNotificationsParams): Promise<void> => {
  logger.info(
    "[subscribeToNotifications] start",
    account,
    conversations.length
  );

  const client = await getXmtpClient({
    address: account,
  });

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

  for (const conversation of conversations) {
    if (conversation.state === "allowed") {
      topicsToUpdateForPeriod[conversation.topic] = {
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

  logger.info(
    `[subscribeToNotifications] saving notifications subscribed to ${
      Object.keys(topicsToUpdateForPeriod).length
    } topics for account ${account}`
  );

  await saveNotificationsSubscribe(
    account,
    nativePushToken,
    nativeTokenQuery.type,
    nativeTokenQuery.type === "android" ? "converse-notifications" : null,
    topicsToUpdateForPeriod
  );
};
