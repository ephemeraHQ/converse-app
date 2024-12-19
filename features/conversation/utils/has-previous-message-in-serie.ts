import { DecodedMessageWithCodecsType } from "@utils/xmtpRN/client";

type HasPreviousMessageInSeriesPayload = {
  currentMessage?: DecodedMessageWithCodecsType;
  previousMessage?: DecodedMessageWithCodecsType;
};

export const hasPreviousMessageInSeries = ({
  currentMessage,
  previousMessage,
}: HasPreviousMessageInSeriesPayload) => {
  if (!previousMessage || !currentMessage) return false;
  return previousMessage.senderInboxId !== currentMessage.senderInboxId;
};
