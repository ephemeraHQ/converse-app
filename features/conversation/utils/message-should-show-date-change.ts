import differenceInMinutes from "date-fns/differenceInMinutes"
import { IConversationMessage } from "../conversation-chat/conversation-message/conversation-message.types"

type MessageShouldShowDateChangePayload = {
  message: IConversationMessage | undefined
  previousMessage: IConversationMessage | undefined
}

export const messageShouldShowDateChange = ({
  message,
  previousMessage,
}: MessageShouldShowDateChangePayload) => {
  if (!message) {
    return false
  }

  if (!previousMessage) {
    return true
  }

  const currentMessageTime = convertNanosecondsToMilliseconds(message.sentNs)
  const previousMessageTime = convertNanosecondsToMilliseconds(previousMessage.sentNs)

  return differenceInMinutes(currentMessageTime, previousMessageTime) >= 5
}

function convertNanosecondsToMilliseconds(nanoseconds: number) {
  return nanoseconds / 1000000
}
