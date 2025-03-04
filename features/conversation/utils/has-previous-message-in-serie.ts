import { IXmtpDecodedMessage } from "@/features/xmtp/xmtp.types"

type HasPreviousMessageInSeriesPayload = {
  currentMessage?: IXmtpDecodedMessage
  previousMessage?: IXmtpDecodedMessage
}

export const hasPreviousMessageInSeries = ({
  currentMessage,
  previousMessage,
}: HasPreviousMessageInSeriesPayload) => {
  if (!previousMessage || !currentMessage) return false
  return previousMessage.senderInboxId === currentMessage.senderInboxId
}
