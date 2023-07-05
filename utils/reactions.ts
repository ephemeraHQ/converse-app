import { XmtpMessage } from "../data/store/xmtpReducer";
import { sentryTrackMessage } from "./sentry";

type MessageReaction = {
  action: "added" | "removed";
  content: string;
  senderAddress: string;
  sent: number;
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
    const lastReactionBySender: { [senderAddress: string]: MessageReaction } =
      {};
    sortedReactions.forEach((reaction) => {
      if (reaction.action === "removed") {
        delete lastReactionBySender[reaction.senderAddress];
      } else {
        lastReactionBySender[reaction.senderAddress] = reaction;
      }
    });

    return lastReactionBySender;
  } catch (error) {
    const data = { error, reactions: message.reactions };
    console.log(data);
    sentryTrackMessage("REACTIONS_PARSING_ERROR", data);
    return {};
  }
};
