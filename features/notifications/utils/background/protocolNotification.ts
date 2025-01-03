import { useInboxIdsList } from "@data/store/accountsStore";
import { ConverseXmtpClientType } from "@/utils/xmtpRN/client.types";
import { getOrBuildXmtpClient } from "@utils/xmtpRN/sync";
import { z } from "zod";
import logger from "@utils/logger";
import {
  handleGroupMessageNotification,
  isGroupMessageContentTopic,
} from "./groupMessageNotification";
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
  logger.debug(
    `[ProtocolNotification] Received a notification for account ${notification.account}`
  );
  const accounts = useInboxIdsList();
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
  const xmtpClient = (await getOrBuildXmtpClient(
    notification.account
  )) as ConverseXmtpClientType;
  if (isGroupMessageContentTopic(notification.contentTopic)) {
    handleGroupMessageNotification(xmtpClient, notification);
  } else if (isGroupWelcomeContentTopic(notification.contentTopic)) {
    handleGroupWelcomeNotification(xmtpClient, notification);
  }
};
