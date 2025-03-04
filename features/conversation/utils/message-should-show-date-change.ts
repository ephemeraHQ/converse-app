import differenceInMinutes from "date-fns/differenceInMinutes"
import { IXmtpDecodedMessage } from "@/features/xmtp/xmtp.types"

type MessageShouldShowDateChangePayload = {
  message: IXmtpDecodedMessage | undefined
  previousMessage: IXmtpDecodedMessage | undefined
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
