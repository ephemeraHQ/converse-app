import { isReadReceiptMessage } from "@/features/conversation/conversation-message/conversation-message.utils";
import { IXmtpDecodedMessage } from "../xmtp.types";

export function isSupportedMessage(message: IXmtpDecodedMessage) {
  if (isReadReceiptMessage(message)) {
    return false;
  }

  return true;
}
