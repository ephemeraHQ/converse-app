import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/client/client.types";
import { MessageDeliveryStatus } from "@xmtp/react-native-sdk";

export function messageIsSent(message: DecodedMessageWithCodecsType) {
  return message.deliveryStatus === MessageDeliveryStatus.PUBLISHED;
}
