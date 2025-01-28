import { URL_REGEX } from "@utils/regex";
import {
  IConvosContentType,
  isContentType,
} from "@/utils/xmtpRN/xmtp-content-types/xmtp-content-types";

type V3SpameScoreParams = {
  messageText: string;
  contentType: IConvosContentType;
};

export const getV3SpamScore = async ({
  messageText,
  contentType,
}: V3SpameScoreParams): Promise<number> => {
  // TODO: Check if adder has been approved already

  let spamScore = 0;
  // TODO: Check spam score between sender and receiver

  // Check contents of last message
  spamScore += computeMessageContentSpamScore(messageText, contentType);
  return spamScore;
};

export const computeMessageContentSpamScore = (
  message: string,
  contentType: IConvosContentType
): number => {
  let spamScore: number = 0.0;

  URL_REGEX.lastIndex = 0;

  if (isContentType({ type: "text", contentType }) && URL_REGEX.test(message)) {
    spamScore += 1;
  }
  if (isContentType({ type: "text", contentType }) && message.includes("$")) {
    spamScore += 1;
  }

  return spamScore;
};
