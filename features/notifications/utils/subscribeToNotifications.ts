import * as Notifications from "expo-notifications";

import { savePushToken } from "@utils/keychain/helpers";
import logger from "@utils/logger";

import {
  ConversationWithCodecsType,
  ConverseXmtpClientType,
} from "@/utils/xmtpRN/client/client.types";
import { getXmtpClient } from "@utils/xmtpRN/sync";
import { useAppStore } from "@data/store/appStore";
import { subscribingByAccount } from "./subscribingByAccount";
import { saveNotificationsSubscribe } from "@/utils/api/notifications";
import { requestPushNotificationsPermissions } from "./requestPushNotificationsPermissions";

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
