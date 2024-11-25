import { DecodedMessageWithCodecsType } from "@utils/xmtpRN/client";
import { messageIsFromCurrentUser } from "./messageIsFromCurrentUser";

type IsLatestSettledFromCurrentUserPayload = {
  message?: DecodedMessageWithCodecsType;
  currentAccount: string;
};

export const isLatestSettledFromCurrentUser = ({
  message,
  currentAccount,
}: IsLatestSettledFromCurrentUserPayload) => {
  if (!message) return false;
  return messageIsFromCurrentUser({
    message,
    currentAccount,
  });
};
