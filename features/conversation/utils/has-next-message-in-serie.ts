import { IXmtpDecodedMessage } from "@/features/xmtp/xmtp.types";

type HasNextMessageInSeriesPayload = {
  currentMessage: IXmtpDecodedMessage;
  nextMessage: IXmtpDecodedMessage | undefined;
};

export const hasNextMessageInSeries = ({
  currentMessage,
  nextMessage,
}: HasNextMessageInSeriesPayload) => {
  if (!nextMessage) return false;
  return nextMessage.senderInboxId === currentMessage.senderInboxId;
};
