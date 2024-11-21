import { getCurrentAccount } from "@data/store/accountsStore";
import { DecodedMessageWithCodecsType } from "@utils/xmtpRN/client";

type MessageFromCurrentUserPayload = {
  message?: DecodedMessageWithCodecsType;
};

export const messageIsFromCurrentUser = ({
  message,
}: MessageFromCurrentUserPayload) => {
  if (!message) return false;
  const currentAccount = getCurrentAccount();
  if (!currentAccount) return false;
  return message.senderAddress.toLowerCase() === currentAccount.toLowerCase();
};
