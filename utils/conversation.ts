import { Reaction } from "@xmtp/content-type-reaction";

import config from "../config";
import { useChatStore } from "../data/store/accountsStore";
import { XmtpMessage, XmtpConversation } from "../data/store/chatStore";
import { isAttachmentMessage } from "./attachment";
import { addressPrefix } from "./str";

export type LastMessagePreview = {
  contentPreview: string;
  message: XmtpMessage;
};

export const conversationLastMessagePreview = (
  conversation: XmtpConversation,
  myAddress: string
): LastMessagePreview | undefined => {
  if (!conversation.messages?.size) return undefined;
  const messagesArray = Array.from(conversation.messages.values());
  let removedReactions: {
    [messageId: string]: { [reactionContent: string]: Reaction };
  } = {};
  while (messagesArray.length > 0) {
    const lastMessage = messagesArray.pop();

    if (!lastMessage) {
      return undefined;
    } else {
      if (isAttachmentMessage(lastMessage.contentType)) {
        removedReactions = {};
        return {
          contentPreview: "📎 Media",
          message: lastMessage,
        };
      } else if (lastMessage?.contentType?.startsWith("xmtp.org/reaction:")) {
        try {
          const reactionContent = JSON.parse(lastMessage.content) as Reaction;
          const message = conversation.messages.get(reactionContent.reference);
          if (!message || message.senderAddress !== myAddress) continue;
          if (reactionContent.action === "removed") {
            removedReactions[reactionContent.reference] =
              removedReactions[reactionContent.reference] || {};
            removedReactions[reactionContent.reference][
              reactionContent.content
            ] = reactionContent;
            continue;
          }
          if (
            reactionContent.reference in removedReactions &&
            reactionContent.content in
              removedReactions[reactionContent.reference]
          ) {
            delete removedReactions[reactionContent.reference][
              reactionContent.content
            ];
            continue;
          } else {
            removedReactions = {};
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
          removedReactions = {};
          continue;
        }
      } else {
        removedReactions = {};
        return {
          contentPreview: lastMessage.content,
          message: lastMessage,
        };
      }
    }
  }
  return undefined;
};

export const computeNewConversationContext = (
  userAddress: string,
  peerAddress: string
) => {
  let i = 0;
  const conversationsIds = Object.values(useChatStore.getState().conversations)
    .filter((c) => c.peerAddress?.toLowerCase() === peerAddress?.toLowerCase())
    .map((c) => c.context?.conversationId);
  // First try to create one without conversationId
  if (!conversationsIds.includes(undefined)) {
    return undefined;
  }
  do {
    i += 1;
  } while (
    conversationsIds.includes(
      `${config.conversationDomain}/dm/${addressPrefix(
        userAddress || ""
      )}-${addressPrefix(peerAddress)}/${i}`
    )
  );
  const conversationId = `${config.conversationDomain}/dm/${addressPrefix(
    userAddress || ""
  )}-${addressPrefix(peerAddress)}/${i}`;
  return {
    conversationId,
    metadata: {},
  };
};
