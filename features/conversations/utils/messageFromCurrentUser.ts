import { DecodedMessageWithCodecsType } from "@utils/xmtpRN/client";

type MessageFromCurrentUserPayload = {
  message?: DecodedMessageWithCodecsType;
  currentAccount: string;
};

export const messageFromCurrentUser = ({
  message,
  currentAccount,
}: MessageFromCurrentUserPayload) => {
  if (!message) return false;
  return message.senderAddress.toLowerCase() === currentAccount.toLowerCase();
};
