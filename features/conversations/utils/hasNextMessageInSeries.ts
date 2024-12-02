import { DecodedMessageWithCodecsType } from "@utils/xmtpRN/client";

type HasNextMessageInSeriesPayload = {
  currentMessage: DecodedMessageWithCodecsType;
  nextMessage: DecodedMessageWithCodecsType;
};

export const hasNextMessageInSeries = ({
  currentMessage,
  nextMessage,
}: HasNextMessageInSeriesPayload) => {
  return nextMessage.senderAddress === currentMessage.senderAddress;
};
