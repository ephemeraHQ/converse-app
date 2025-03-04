import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { isSameInboxId } from "@/features/xmtp/xmtp-inbox-id/xmtp-inbox-id.utils"
import { IXmtpDecodedMessage } from "@/features/xmtp/xmtp.types"
import logger from "@/utils/logger"

type MessageFromCurrentUserPayload = {
  message: IXmtpDecodedMessage
}

export function messageIsFromCurrentAccountInboxId({ message }: MessageFromCurrentUserPayload) {
  const { inboxId: currentInboxId } = getSafeCurrentSender()
  const messageSenderInboxId = message?.senderInboxId.toLowerCase()
  if (!currentInboxId) {
    logger.warn("[messageIsFromCurrentAccountInboxId] No current account inbox id")
    return false
  }
  if (!messageSenderInboxId) {
    logger.warn("[messageIsFromCurrentAccountInboxId] No message sender inbox id")
    return false
  }
  return isSameInboxId(messageSenderInboxId, currentInboxId)
}
