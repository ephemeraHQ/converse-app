import { getAccountsList } from "@data/store/accountsStore";
import { ConverseXmtpClientType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { getXmtpClient } from "@/utils/xmtpRN/xmtp-client/xmtp-client";
import { z } from "zod";
import logger from "@utils/logger";
import { handleV3MessageNotification } from "./groupMessageNotification";
import {
  handleGroupWelcomeNotification,
  isGroupWelcomeContentTopic,
} from "./groupWelcomeNotification";
import { isV3Topic } from "@/utils/groupUtils/groupId";

export const ProtocolNotificationSchema = z.object({
  account: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  contentTopic: z.string(),
  message: z.string(),
});

export type ProtocolNotification = z.infer<typeof ProtocolNotificationSchema>;

export const handleProtocolNotification = async (
  notification: ProtocolNotification
) => {
  try {
    logger.debug(
      `[ProtocolNotification] Received a notification for account ${notification.account}`
    );
    const accounts = getAccountsList();
    if (
      !accounts.find(
        (a) => a.toLowerCase() === notification.account.toLowerCase()
      )
    ) {
      logger.error(
        `[ProtocolNotification] Account ${notification.account} not found, skipping`
      );
      return;
    }
    logger.debug(
      `[ProtocolNotification] found account ${notification.account}`
    );
    const xmtpClient = (await getXmtpClient(
      notification.account
    )) as ConverseXmtpClientType;
    if (isV3Topic(notification.contentTopic)) {
      handleV3MessageNotification(xmtpClient, notification);
    } else if (isGroupWelcomeContentTopic(notification.contentTopic)) {
      handleGroupWelcomeNotification(xmtpClient, notification);
    }
  } catch (e) {
    logger.error("handleProtocolNotification error", e);
  }
};
