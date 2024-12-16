import { DecodedMessageWithCodecsType } from "@utils/xmtpRN/client";
import { messageIsFromCurrentUser } from "./message-is-from-current-user";

type IsLatestMessageSettledFromPeerPayload = {
  message?: DecodedMessageWithCodecsType;
  nextMessage?: DecodedMessageWithCodecsType;
  currentAccount: string;
};

export const isLatestMessageSettledFromPeer = ({
  message,
  currentAccount,
  nextMessage,
}: IsLatestMessageSettledFromPeerPayload) => {
  if (!message) return false;
  if (
    !messageIsFromCurrentUser({
      message,
    })
  )
    return false;
  if (!nextMessage) return true;
  return nextMessage.senderAddress !== message.senderAddress;
};
