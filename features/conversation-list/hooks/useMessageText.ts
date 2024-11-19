import { useMemo } from "react";
import logger from "@utils/logger";
import { DecodedMessageWithCodecsType } from "@utils/xmtpRN/client";
import { getMessageContentType } from "@utils/xmtpRN/contentTypes";

export const useMessageText = (
  message: DecodedMessageWithCodecsType | undefined
) => {
  return useMemo(() => {
    if (!message) return "";
    try {
      const content = message?.content();
      const contentType = getMessageContentType(message.contentTypeId);
      if (contentType === "conversationUpdated") {
        //  TODO: Update this
        return "conversation updated";
      }
      if (typeof content === "string") {
        return content;
      }
      return message?.fallback;
    } catch (e) {
      logger.error("Error getting message text", {
        error: e,
        contentTypeId: message.contentTypeId,
      });
      return message.fallback;
    }
  }, [message]);
};
