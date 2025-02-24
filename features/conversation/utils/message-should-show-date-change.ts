import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import { IXmtpDecodedMessage } from "@/features/xmtp/xmtp.types";

type MessageShouldShowDateChangePayload = {
  message: IXmtpDecodedMessage | undefined;
  previousMessage: IXmtpDecodedMessage | undefined;
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
  return (
    differenceInCalendarDays(
      convertNanosecondsToMilliseconds(message.sentNs),
      convertNanosecondsToMilliseconds(previousMessage.sentNs),
    ) > 0
  );
};

function convertNanosecondsToMilliseconds(nanoseconds: number) {
  return nanoseconds / 1000000;
}
