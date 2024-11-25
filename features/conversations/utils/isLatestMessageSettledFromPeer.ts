import { DecodedMessageWithCodecsType } from "@utils/xmtpRN/client";
import { messageIsFromCurrentUser } from "./messageIsFromCurrentUser";

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
      currentAccount,
    })
  )
    return false;
  if (!nextMessage) return true;
  return nextMessage.senderAddress !== message.senderAddress;
};
