import { getCurrentAccountInboxId } from "@/hooks/use-current-account-inbox-id";
import logger from "@/utils/logger";
import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { isSameInboxId } from "@/utils/xmtpRN/xmtp-inbox-id/xmtp-inbox-id";

type MessageFromCurrentUserPayload = {
  message: DecodedMessageWithCodecsType;
};

export function messageIsFromCurrentAccountInboxId({
  message,
}: MessageFromCurrentUserPayload) {
  const currentAccountInboxId = getCurrentAccountInboxId();
  const messageSenderInboxId = message?.senderInboxId.toLowerCase();
  if (!currentAccountInboxId) {
    logger.warn(
      "[messageIsFromCurrentAccountInboxId] No current account inbox id"
    );
    return false;
  }
  if (!messageSenderInboxId) {
    logger.warn(
      "[messageIsFromCurrentAccountInboxId] No message sender inbox id"
    );
    return false;
  }
  return isSameInboxId(messageSenderInboxId, currentAccountInboxId);
}
