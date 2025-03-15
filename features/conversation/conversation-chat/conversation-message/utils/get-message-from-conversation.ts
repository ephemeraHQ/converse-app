import { IConversationMessageId } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.types"
import { getConversationMessagesQueryData } from "@/features/conversation/conversation-chat/conversation-messages.query"
import { IConversationTopic } from "@/features/conversation/conversation.types"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"

export function getMessageFromConversationSafe({
  messageId,
  topic,
  clientInboxId,
}: {
  messageId: IConversationMessageId
  topic: IConversationTopic
  clientInboxId: IXmtpInboxId
}) {
  // First try in our local cache
  const messages = getConversationMessagesQueryData({
    clientInboxId,
    topic,
  })

  if (!messages) {
    throw new Error(`Couldn't get conversation messages`)
  }

  return messages.byId[messageId]
}
