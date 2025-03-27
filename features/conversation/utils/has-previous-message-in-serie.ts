import { IConversationMessage } from "../conversation-chat/conversation-message/conversation-message.types"

type HasPreviousMessageInSeriesPayload = {
  currentMessage?: IConversationMessage
  previousMessage?: IConversationMessage
}

export const hasPreviousMessageInSeries = ({
  currentMessage,
  previousMessage,
}: HasPreviousMessageInSeriesPayload) => {
  if (!previousMessage || !currentMessage) return false
  return previousMessage.senderInboxId === currentMessage.senderInboxId
}
