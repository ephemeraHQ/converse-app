import { getCurrentUserAccountInboxId } from "@/features/conversation/conversation-message/conversation-message.utils";
import { getCurrentAccount } from "@data/store/accountsStore";
import { DecodedMessageWithCodecsType } from "@utils/xmtpRN/client";

type MessageFromCurrentUserPayload = {
  message: DecodedMessageWithCodecsType | undefined;
};

export const messageIsFromCurrentUser = ({
  message,
}: MessageFromCurrentUserPayload) => {
  if (!message) return false;
  const currentAccount = getCurrentAccount();
  if (!currentAccount) return false;
  return message.senderAddress.toLowerCase() === currentAccount.toLowerCase();
};

export function messageIsFromCurrentUserV3({
  message,
}: MessageFromCurrentUserPayload) {
  return (
    message?.senderAddress.toLowerCase() === getCurrentUserAccountInboxId()
  );
}
