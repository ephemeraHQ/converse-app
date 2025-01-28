import { getCurrentAccountInboxId } from "@/hooks/use-current-account-inbox-id";
import logger from "@/utils/logger";
import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";

type MessageFromCurrentUserPayload = {
  message: DecodedMessageWithCodecsType | undefined;
};

export function messageIsFromCurrentAccountInboxId({
  message,
}: MessageFromCurrentUserPayload) {
  const currentAccountInboxId = getCurrentAccountInboxId();
  const messageSenderInboxId = message?.senderInboxId.toLowerCase();

  logger.debug("[messageIsFromCurrentAccountInboxId] Checking message sender", {
    messageSenderInboxId,
    currentAccountInboxId,
  });

  return messageSenderInboxId === currentAccountInboxId;
}
