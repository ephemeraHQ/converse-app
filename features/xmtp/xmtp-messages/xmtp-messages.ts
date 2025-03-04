import { Conversation } from "@xmtp/react-native-sdk"
import { isReadReceiptMessage } from "@/features/conversation/conversation-message/conversation-message.utils"
import { captureError } from "@/utils/capture-error"
import { XMTPError } from "@/utils/error"
import { IXmtpDecodedMessage } from "../xmtp.types"

export function isSupportedMessage(message: IXmtpDecodedMessage) {
  if (isReadReceiptMessage(message)) {
    return false
  }

  return true
}

export async function getXmtpConversationMessages(args: {
  conversation: Conversation
  limit?: number
}) {
  const { conversation, limit = 30 } = args
  try {
    const beforeMs = new Date().getTime()
    const messages = await conversation.messages({
      limit,
    })
    const afterMs = new Date().getTime()

    const timeDiffMs = afterMs - beforeMs
    if (timeDiffMs > 3000) {
      captureError(
        new XMTPError({
          error: new Error(
            `Fetching conversation messages took ${timeDiffMs}ms for topic ${conversation.topic}`,
          ),
        }),
      )
    }

    return messages
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: `Error fetching messages for conversation ${conversation.topic}`,
    })
  }
}
