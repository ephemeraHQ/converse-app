import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { IConversationMessageId } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.types"
import { getConversationMessagesQueryData } from "@/features/conversation/conversation-chat/conversation-messages.query"
import { IConversationTopic } from "@/features/conversation/conversation.types"

export function getConversationNextMessage(args: {
  messageId: IConversationMessageId
  topic: IConversationTopic
}) {
  const { messageId, topic } = args
  const currentSender = getSafeCurrentSender()
  const messages = getConversationMessagesQueryData({
    clientInboxId: currentSender.inboxId,
    topic,
  })
  if (!messages?.ids.includes(messageId)) {
    return undefined
  }
  const currentIndex = messages.ids.indexOf(messageId)
  const nextMessageId = messages.ids[currentIndex - 1]
  return nextMessageId ? messages.byId[nextMessageId] : undefined
}
