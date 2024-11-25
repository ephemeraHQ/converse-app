import { URL_REGEX } from "../../../utils/regex";
import {
  IConvosContentType,
  isContentType,
} from "../../../utils/xmtpRN/contentTypes";

type V3SpameScoreParams = {
  message: string;
  contentType: IConvosContentType;
};

export const getV3SpamScore = async ({
  message,
  contentType,
}: V3SpameScoreParams): Promise<number> => {
  // TODO: Check if adder has been approved already

  let spamScore = 0;
  // TODO: Check spam score between sender and receiver

  // Check contents of last message
  spamScore += computeSpamScore(message, contentType);
  return spamScore;
};

const computeSpamScore = (
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
