import { XmtpMessage } from "../data/store/xmtpReducer";
import { sentryTrackMessage } from "./sentry";

type MessageReaction = {
  action: "added" | "removed";
  content: string;
  senderAddress: string;
  sent: number;
  schema: "unicode" | "shortcode" | "custom";
};

type MessageReactions = { [reactionId: string]: MessageReaction };

export const getMessageReactions = (message: XmtpMessage) => {
  // Returns the last reaction for each sender
  try {
    if (!message.reactions || message.reactions === "[]") return {};
    const reactions = JSON.parse(message.reactions) as MessageReactions;
    const sortedReactions = Object.values(reactions).sort(
      (a, b) => a.sent - b.sent
    );

    const reactionsBySender: {
      [senderAddress: string]: { [reactionContent: string]: MessageReaction };
    } = {};
    // We get all reactions for each sender, there might be multiple
    // but we'll only show one!
    sortedReactions.forEach((reaction) => {
      if (
        reaction.action === "removed" &&
        reactionsBySender[reaction.senderAddress]?.[reaction.content]
      ) {
        delete reactionsBySender[reaction.senderAddress][reaction.content];
      } else if (reaction.action === "added") {
        reactionsBySender[reaction.senderAddress] =
          reactionsBySender[reaction.senderAddress] || {};
        reactionsBySender[reaction.senderAddress][reaction.content] = reaction;
      }
    });

    const lastReactionBySender: {
      [senderAddress: string]: MessageReaction;
    } = {};

    for (const senderAddress in reactionsBySender) {
      const reactions = Object.values(reactionsBySender[senderAddress]).sort(
        (a, b) => b.sent - a.sent
      );
      if (reactions.length > 0) {
        lastReactionBySender[senderAddress] = reactions[0];
      }
    }

    return lastReactionBySender;
  } catch (error) {
    const data = { error, reactions: message.reactions };
    console.log(data);
    sentryTrackMessage("REACTIONS_PARSING_ERROR", data);
    return {};
  }
};
