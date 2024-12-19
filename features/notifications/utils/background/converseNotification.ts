import { getAccountsList } from "@data/store/accountsStore";
import { ConverseXmtpClientType } from "@/utils/xmtpRN/client.types";
import { getXmtpClient } from "@utils/xmtpRN/sync";
import { z } from "zod";
import logger from "@utils/logger";
import {
  GroupJoinRequestNotificationSchema,
  handleGroupJoinRequestNotification,
} from "./groupJoinRequestNotification";

// Add other converse notifications here, with different "type" values
export const ConverseNotificationSchema = z.discriminatedUnion("type", [
  GroupJoinRequestNotificationSchema,
]);

export type ConverseNotification = z.infer<typeof ConverseNotificationSchema>;

export const handleConverseNotification = async (
  notification: ConverseNotification
) => {
  logger.debug(
    `[ConverseNotification] Received a ${notification.type} notification for account ${notification.account}`
  );
  const accounts = getAccountsList();
  if (
    !accounts.find(
      (a) => a.toLowerCase() === notification.account.toLowerCase()
    )
  ) {
    logger.error(
      `[ConverseNotification] Account ${notification.account} not found, skipping`
    );
    return;
  }
  const xmtpClient = (await getXmtpClient(
    notification.account
  )) as ConverseXmtpClientType;
  if (notification.type === "group_join_request") {
    handleGroupJoinRequestNotification(xmtpClient, notification);
  }
};
