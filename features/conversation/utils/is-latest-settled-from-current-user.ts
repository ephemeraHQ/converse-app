import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/client.types";
import { messageIsFromCurrentUser } from "./message-is-from-current-user";

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
