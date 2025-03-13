import { IXmtpMessageDeliveryStatusValues } from "@/features/xmtp/xmtp.types"
import { IConversationMessage } from "../conversation-message.types"

export function messageIsSent(message: IConversationMessage) {
  return message.deliveryStatus === IXmtpMessageDeliveryStatusValues.PUBLISHED
}

export function messageIsDelivered(message: IConversationMessage) {
  return message.deliveryStatus === IXmtpMessageDeliveryStatusValues.PUBLISHED
}
