import { useInboxIdsList } from "@data/store/accountsStore";
import { z } from "zod";
import logger from "@utils/logger";
import {
  GroupJoinRequestNotificationSchema,
  handleGroupJoinRequestNotification,
} from "./groupJoinRequestNotification";
import { getInboxIdFromCryptocurrencyAddress } from "@/utils/xmtpRN/signIn";

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
  const accounts = useInboxIdsList();
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
  const inboxId = await getInboxIdFromCryptocurrencyAddress({
    address: notification.account,
    cryptocurrency: "ETH",
  });
  if (notification.type === "group_join_request") {
    handleGroupJoinRequestNotification(inboxId, notification);
  }
};
