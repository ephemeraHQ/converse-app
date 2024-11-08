import { DecodedMessageWithCodecsType } from "@utils/xmtpRN/client";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";

type MessageShouldShowDateChangePayload = {
  message?: DecodedMessageWithCodecsType;
  previousMessage?: DecodedMessageWithCodecsType;
};

export const messageShouldShowDateChange = ({
  message,
  previousMessage,
}: MessageShouldShowDateChangePayload) => {
  if (!message) {
    return false;
  }
  if (!previousMessage) {
    return true;
  }
  return differenceInCalendarDays(message.sent, previousMessage.sent) > 0;
};
