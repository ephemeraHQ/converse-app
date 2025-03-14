import { IConversationMessage } from "../conversation-chat/conversation-message/conversation-message.types"

type HasNextMessageInSeriesPayload = {
  currentMessage: IConversationMessage
  nextMessage: IConversationMessage | undefined
}

export const hasNextMessageInSeries = ({
  currentMessage,
  nextMessage,
}: HasNextMessageInSeriesPayload) => {
  if (!nextMessage) return false
  return nextMessage.senderInboxId === currentMessage.senderInboxId
}
