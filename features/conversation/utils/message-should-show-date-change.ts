import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/client.types";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";

type MessageShouldShowDateChangePayload = {
  message: DecodedMessageWithCodecsType | undefined;
  previousMessage: DecodedMessageWithCodecsType | undefined;
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
      convertNanosecondsToMilliseconds(previousMessage.sentNs)
    ) > 0
  );
};

function convertNanosecondsToMilliseconds(nanoseconds: number) {
  return nanoseconds / 1000000;
}
