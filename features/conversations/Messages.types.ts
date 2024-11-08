import { DecodedMessageWithCodecsType } from "@utils/xmtpRN/client";

export type V3MessageToDisplay = {
  message?: DecodedMessageWithCodecsType;
  hasPreviousMessageInSeries: boolean;
  hasNextMessageInSeries: boolean;
  dateChange: boolean;
  fromMe: boolean;
  isLatestSettledFromMe: boolean;
  isLatestSettledFromPeer: boolean;
  isLoadingAttachment: boolean | undefined;
  nextMessageIsLoadingAttachment: boolean | undefined;
};
