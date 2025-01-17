import {
  isCoinbasePaymentMessage,
  isReadReceiptMessage,
  isTransactionReferenceMessage,
} from "@/features/conversation/conversation-message/conversation-message.utils";
import { DecodedMessageWithCodecsType } from "../client/client.types";

export function isSupportedMessage(message: DecodedMessageWithCodecsType) {
  if (isReadReceiptMessage(message)) {
    return false;
  }

  if (isTransactionReferenceMessage(message)) {
    return false;
  }

  if (isCoinbasePaymentMessage(message)) {
    return false;
  }

  return true;
}
