import {
  isReplyMessage,
  isStaticAttachmentMessage,
} from "@/features/conversation/conversation-message/conversation-message.utils";
import logger from "@utils/logger";
import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/client.types";
import { getMessageContentType } from "@/utils/xmtpRN/content-types/content-types";
import { DecodedMessage, ReplyCodec } from "@xmtp/react-native-sdk";
import { useMemo } from "react";

export const useMessageText = (
  message: DecodedMessageWithCodecsType | undefined
) => {
  return useMemo(() => {
    if (!message) return "";

    try {
      if (isReplyMessage(message)) {
        const messageTyped = message as DecodedMessage<ReplyCodec>;
        const content = messageTyped.content();

        if (typeof content === "string") {
          return content;
        }
        return content.content.text;
      }

      if (isStaticAttachmentMessage(message)) {
        return "Attachment";
      }

      const content = message?.content();
      const contentType = getMessageContentType(message.contentTypeId);
      if (contentType === "groupUpdated") {
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
