import { DecodedMessageWithCodecsType } from "@utils/xmtpRN/client";
import { messageIsFromCurrentUser } from "./messageIsFromCurrentUser";

type IsLatestSettledFromCurrentUserPayload = {
  message?: DecodedMessageWithCodecsType;
};

export const isLatestSettledFromCurrentUser = ({
  message,
}: IsLatestSettledFromCurrentUserPayload) => {
  if (!message) return false;
  return messageIsFromCurrentUser({
    message,
  });
};
