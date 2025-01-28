import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { MessageDeliveryStatus } from "@xmtp/react-native-sdk";

export function messageIsSent(message: DecodedMessageWithCodecsType) {
  return message.deliveryStatus === MessageDeliveryStatus.PUBLISHED;
}
