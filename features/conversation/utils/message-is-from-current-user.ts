import { getCurrentInboxId } from "@/data/store/accountsStore";
import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/client.types";

type MessageFromCurrentUserPayload = {
  message: DecodedMessageWithCodecsType | undefined;
};

export function messageIsFromCurrentAccountInboxId({
  message,
}: MessageFromCurrentUserPayload) {
  return message?.senderInboxId.toLowerCase() === getCurrentInboxId();
}
