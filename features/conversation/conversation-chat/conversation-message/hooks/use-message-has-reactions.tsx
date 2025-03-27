import { IXmtpMessageId } from "@/features/xmtp/xmtp.types"
import { useConversationMessageReactions } from "./use-conversation-message-reactions"

export function useMessageHasReactions(args: { xmtpMessageId: IXmtpMessageId }) {
  const { xmtpMessageId } = args
  const reactions = useConversationMessageReactions(xmtpMessageId)
  return Object.values(reactions.bySender || {}).some((reactions) => reactions.length > 0)
}
