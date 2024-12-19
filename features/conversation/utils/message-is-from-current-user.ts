import { getCurrentUserAccountInboxId } from "@/hooks/use-current-account-inbox-id";
import { getCurrentAccount } from "@data/store/accountsStore";
import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/client.types";

type MessageFromCurrentUserPayload = {
  message: DecodedMessageWithCodecsType | undefined;
};

export const messageIsFromCurrentUser = ({
  message,
}: MessageFromCurrentUserPayload) => {
  if (!message) return false;
  const currentAccount = getCurrentAccount();
  if (!currentAccount) return false;
  return message.senderInboxId.toLowerCase() === currentAccount.toLowerCase();
};

export function messageIsFromCurrentUserV3({
  message,
}: MessageFromCurrentUserPayload) {
  return (
    message?.senderInboxId.toLowerCase() === getCurrentUserAccountInboxId()
  );
}
