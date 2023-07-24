import { Reaction } from "@xmtp/content-type-reaction";

import { XmtpConversation, XmtpMessage } from "../data/store/xmtpReducer";
import { isAttachmentMessage } from "./attachment";

type LastMessagePreview = {
  contentPreview: string;
  message: XmtpMessage;
};

export const conversationLastMessagePreview = (
  conversation: XmtpConversation,
  myAddress?: string
): LastMessagePreview | undefined => {
  if (!conversation.messages?.size) return "";
  const messagesArray = Array.from(conversation.messages.values());
  let removedReactionFromMessage: Reaction | undefined = undefined;
  while (messagesArray.length > 0) {
    const lastMessage = messagesArray.pop();
    if (!lastMessage) {
      return undefined;
    } else {
      if (isAttachmentMessage(lastMessage.contentType)) {
        removedReactionFromMessage = undefined;
        return {
          contentPreview: "📎 Media",
          message: lastMessage,
        };
      } else if (lastMessage?.contentType?.startsWith("xmtp.org/reaction:")) {
        try {
          const reactionContent = JSON.parse(lastMessage.content) as Reaction;
          if (reactionContent.action === "removed") {
            removedReactionFromMessage = reactionContent;
            continue;
          }
          const message = conversation.messages.get(reactionContent.reference);
          if (!message || message.senderAddress !== myAddress) continue;
          if (
            removedReactionFromMessage?.reference === reactionContent.reference
          ) {
            removedReactionFromMessage = undefined;
            continue;
          } else {
            removedReactionFromMessage = undefined;
            const isAttachment = isAttachmentMessage(message.contentType);
            if (reactionContent.schema === "unicode") {
              return {
                contentPreview: `Reacted ${reactionContent.content} to ${
                  isAttachment ? "a media" : `“${message.content}”`
                }`,
                message: lastMessage,
              };
            } else {
              return {
                contentPreview: "Reacted to a message",
                message: lastMessage,
              };
            }
          }
        } catch (e) {
          console.log(e);
          removedReactionFromMessage = undefined;
          continue;
        }
      } else {
        removedReactionFromMessage = undefined;
        return {
          contentPreview: lastMessage.content,
          message: lastMessage,
        };
      }
    }
  }
  return undefined;
};
