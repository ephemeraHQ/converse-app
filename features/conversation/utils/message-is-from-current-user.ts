import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { isSameInboxId } from "@/features/xmtp/xmtp-inbox-id/xmtp-inbox-id.utils"
import logger from "@/utils/logger"
import { IConversationMessage } from "../conversation-chat/conversation-message/conversation-message.types"

type MessageFromCurrentUserPayload = {
  message: IConversationMessage
}

export function messageIsFromCurrentSenderInboxId({ message }: MessageFromCurrentUserPayload) {
  const { inboxId: currentInboxId } = getSafeCurrentSender()
  const messageSenderInboxId = message?.senderInboxId

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
