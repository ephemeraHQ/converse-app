import { getCurrentUserAccountInboxId } from "@/hooks/use-current-account-inbox-id";
import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/client.types";

type MessageFromCurrentUserPayload = {
  message: DecodedMessageWithCodecsType | undefined;
};

export function messageIsFromCurrentAccountInboxId({
  message,
}: MessageFromCurrentUserPayload) {
  return (
    message?.senderInboxId.toLowerCase() === getCurrentUserAccountInboxId()
  );
}
