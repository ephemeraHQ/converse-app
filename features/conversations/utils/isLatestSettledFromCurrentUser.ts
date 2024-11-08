import { DecodedMessageWithCodecsType } from "@utils/xmtpRN/client";
import { messageFromCurrentUser } from "./messageFromCurrentUser";

type IsLatestSettledFromCurrentUserPayload = {
  message?: DecodedMessageWithCodecsType;
  currentAccount: string;
};

export const isLatestSettledFromCurrentUser = ({
  message,
  currentAccount,
}: IsLatestSettledFromCurrentUserPayload) => {
  if (!message) return false;
  return messageFromCurrentUser({
    message,
    currentAccount,
  });
};
