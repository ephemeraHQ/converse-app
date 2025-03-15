import { IConversationMessageId } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.types"
import { useConversationMessageReactions } from "./use-conversation-message-reactions"

export function useMessageHasReactions(args: { messageId: IConversationMessageId }) {
  const { messageId } = args
  const reactions = useConversationMessageReactions(messageId)
  return Object.values(reactions.bySender || {}).some((reactions) => reactions.length > 0)
}
