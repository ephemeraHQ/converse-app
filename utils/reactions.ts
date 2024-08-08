import { translate } from "@i18n/translate";
import { ContentTypeReaction } from "@xmtp/content-type-reaction";

import { isAttachmentMessage } from "./attachment/helpers";
import logger from "./logger";
import { sendMessage } from "./message";
import { getMessageContentType } from "./xmtpRN/contentTypes";
import { XmtpConversation, XmtpMessage } from "../data/store/chatStore";
import { emojisByCategory } from "../vendor/rn-emoji-keyboard";

export type MessageReaction = {
  action: "added" | "removed";
  content: string;
  senderAddress: string;
  sent: number;
  schema: "unicode" | "shortcode" | "custom";
};

export const getMessageReactions = (message: XmtpMessage) => {
  try {
    if (!message.reactions || message.reactions.size === 0) return {};

    const reactions = Array.from(message.reactions.values()).map(
      (c) =>
        ({
          ...JSON.parse(c.content),
          senderAddress: c.senderAddress,
          sent: c.sent,
        }) as MessageReaction
    );

    // Sort reactions by sent time, descending (most recent first)
    const sortedReactions = reactions.sort((a, b) => b.sent - a.sent);

    const reactionsBySender: {
      [senderAddress: string]: { [reactionContent: string]: MessageReaction };
    } = {};

    const processedPairs = new Set<string>();

    // Process reactions, considering the most recent action for each unique sender-reaction pair
    for (const reaction of sortedReactions) {
      const pairKey = `${reaction.senderAddress}:${reaction.content}`;

      if (!processedPairs.has(pairKey)) {
        processedPairs.add(pairKey);

        if (reaction.action === "added") {
          if (!reactionsBySender[reaction.senderAddress]) {
            reactionsBySender[reaction.senderAddress] = {};
          }
          reactionsBySender[reaction.senderAddress][reaction.content] =
            reaction;
        } else if (reaction.action === "removed") {
          // If the action is "removed", delete the reaction for this sender if it exists
          if (reactionsBySender[reaction.senderAddress]) {
            delete reactionsBySender[reaction.senderAddress][reaction.content];
          }
        }
      }
    }

    // Convert the reactionsBySender object to the desired output format
    const activeReactionsBySender: {
      [senderAddress: string]: MessageReaction[];
    } = {};

    for (const senderAddress in reactionsBySender) {
      activeReactionsBySender[senderAddress] = Object.values(
        reactionsBySender[senderAddress]
      );
    }

    return activeReactionsBySender;
  } catch (error) {
    logger.error(error, {
      context: "REACTIONS_PARSING_ERROR",
      reactions: message.reactions,
    });
    return {};
  }
};

export const RECENT_EMOJI_STORAGE_KEY = "RECENT_EMOJI_STORAGE_KEY";

export const DEFAULT_EMOJIS = `[{"emoji":"👍","name":"thumbs up","v":"0.6","toneEnabled":true,"keywords":["thumbs_up","thumbsup","yes","awesome","good","agree","accept","cool","hand","like","+1"]},{"emoji":"❤️","name":"red heart","v":"0.6","toneEnabled":false,"keywords":["red_heart","love","like","valentines"]},{"emoji":"😂","name":"face with tears of joy","v":"0.6","toneEnabled":false,"keywords":["face_with_tears_of_joy","face","cry","tears","weep","happy","happytears","haha"]},{"emoji":"😮","name":"face with open mouth","v":"1.0","toneEnabled":false,"keywords":["face_with_open_mouth","face","surprise","impressed","wow","whoa",":O"]},{"emoji":"😢","name":"crying face","v":"0.6","toneEnabled":false,"keywords":["crying_face","face","tears","sad","depressed","upset",":'("]},{"emoji":"🙏","name":"folded hands","v":"0.6","toneEnabled":true,"keywords":["folded_hands","please","hope","wish","namaste","highfive","pray","thank you","thanks","appreciate"]},{"emoji":"🔵","name":"blue circle","v":"0.6","toneEnabled":false,"keywords":["blue_circle","shape","icon","button"]},{"emoji":"🔴","name":"red circle","v":"0.6","toneEnabled":false,"keywords":["red_circle","shape","error","danger"]},{"emoji":"🌿","name":"herb","v":"0.6","toneEnabled":false,"keywords":["herb","vegetable","plant","medicine","weed","grass","lawn"]},{"emoji":"💜","name":"purple heart","v":"0.6","toneEnabled":false,"keywords":["purple_heart","love","like","affection","valentines"]},{"emoji":"🌈","name":"rainbow","v":"0.6","toneEnabled":false,"keywords":["rainbow","nature","happy","unicorn_face","photo","sky","spring"]},{"emoji":"🦊","keywords":["fox","animal","nature","face"],"name":"fox","toneEnabled":false,"v":"3.0"},{"emoji":"👉","keywords":["backhand_index_pointing_right","fingers","hand","direction","right"],"name":"backhand index pointing right","toneEnabled":true,"v":"0.6"},{"emoji":"👈","keywords":["backhand_index_pointing_left","direction","fingers","hand","left"],"name":"backhand index pointing left","toneEnabled":true,"v":"0.6"}]`;

export const getReactionContent = (r: MessageReaction) =>
  r.schema === "unicode" ? r.content : "?";

export const getEmojiName = (emojiString: string) => {
  let foundEmojiName: string | undefined = undefined;
  let categoryId = 0;
  while (!foundEmojiName && categoryId < emojisByCategory.length) {
    const category = emojisByCategory[categoryId];
    let emojiId = 0;
    while (!foundEmojiName && emojiId < category.data.length) {
      const emoji = category.data[emojiId];
      if (emoji.emoji === emojiString) {
        foundEmojiName = emoji.name;
      }
      emojiId += 1;
    }
    categoryId += 1;
  }
  return foundEmojiName;
};

export const getReactionsContentPreview = (
  message: XmtpMessage,
  reactionContent: string
) => {
  const contentType = getMessageContentType(message.contentType);
  let contentPreview: string;
  switch (contentType) {
    case "attachment":
    case "remoteAttachment":
      contentPreview = translate("reacted_to_media", { reactionContent });
      break;
    case "transactionReference":
    case "coinbasePayment":
      contentPreview = translate("reacted_to_transaction", { reactionContent });
      break;
    default: // Handles 'text' and other types
      contentPreview = translate("reacted_to_other", {
        reactionContent,
        content: message.content,
      });
      break;
  }
  return contentPreview;
};

export const addReactionToMessage = (
  conversation: XmtpConversation,
  message: XmtpMessage,
  emoji: string
) => {
  const contentFallback = getReactionsContentPreview(message, emoji);
  sendMessage({
    conversation,
    content: JSON.stringify({
      reference: message.id,
      action: "added",
      content: emoji,
      schema: "unicode",
    }),
    contentType: ContentTypeReaction.toString(),
    contentFallback,
    referencedMessageId: message.id,
  });
};

export const removeReactionFromMessage = (
  conversation: XmtpConversation,
  message: XmtpMessage,
  emoji: string
) => {
  const isAttachment = isAttachmentMessage(message.contentType);
  sendMessage({
    conversation,
    content: JSON.stringify({
      reference: message.id,
      action: "removed",
      content: emoji,
      schema: "unicode",
    }),
    contentType: ContentTypeReaction.toString(),
    contentFallback: isAttachment
      ? translate("removed_reaction_to_attachment")
      : translate("removed_reaction_to", {
          content: message.content,
        }),
    referencedMessageId: message.id,
  });
};
