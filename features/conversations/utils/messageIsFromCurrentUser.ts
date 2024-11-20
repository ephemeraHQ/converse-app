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
    message?.senderAddress.toLowerCase() ===
    "922683db727eab445019a283397f79dd20c86168f47479d0a85a36f4f167ffa1"
    // "3b1b5e73056be3ec699e94ba3bffb1f171156ab417a5e69d081dba10cf12e06d"
  );
}
