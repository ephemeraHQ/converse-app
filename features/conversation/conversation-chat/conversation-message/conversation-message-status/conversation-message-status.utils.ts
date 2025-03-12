import { IXmtpDecodedMessage, IXmtpMessageDeliveryStatusValues } from "@/features/xmtp/xmtp.types"

export function messageIsSent(message: IXmtpDecodedMessage) {
  return message.deliveryStatus === IXmtpMessageDeliveryStatusValues.PUBLISHED
}

export function messageIsDelivered(message: IXmtpDecodedMessage) {
  return message.deliveryStatus === IXmtpMessageDeliveryStatusValues.PUBLISHED
}
