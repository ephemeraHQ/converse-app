import { isV3Topic } from "@/utils/groupUtils/groupId";
import { getXmtpClient } from "@/utils/xmtpRN/xmtp-client/xmtp-client";
import { getAccountsList } from "@data/store/accountsStore";
import logger from "@utils/logger";
import { z } from "zod";
import { handleV3MessageNotification } from "./groupMessageNotification";
import {
  handleGroupWelcomeNotification,
  isGroupWelcomeContentTopic,
} from "./groupWelcomeNotification";

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
    const xmtpClient = await getXmtpClient({
      address: notification.account,
    });
    if (isV3Topic(notification.contentTopic)) {
      handleV3MessageNotification(xmtpClient, notification);
    } else if (isGroupWelcomeContentTopic(notification.contentTopic)) {
      handleGroupWelcomeNotification(xmtpClient, notification);
    }
  } catch (e) {
    logger.error("handleProtocolNotification error", e);
  }
};
