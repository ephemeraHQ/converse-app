import { MessageDeliveryStatus } from "@xmtp/react-native-sdk"
import { IXmtpDecodedMessage } from "@/features/xmtp/xmtp.types"

export function messageIsSent(message: IXmtpDecodedMessage) {
  return message.deliveryStatus === MessageDeliveryStatus.PUBLISHED
}
