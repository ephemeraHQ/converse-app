import { DecodedMessageWithCodecsType } from "@utils/xmtpRN/client";
import { messageIsFromCurrentUser } from "./message-is-from-current-user";

type IsLatestMessageSettledFromPeerPayload = {
  message: DecodedMessageWithCodecsType;
  nextMessage: DecodedMessageWithCodecsType | undefined;
};

export const isLatestMessageSettledFromPeer = ({
  message,
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
  return nextMessage.senderInboxId !== message.senderInboxId;
};
