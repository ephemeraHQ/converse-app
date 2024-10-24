import { useMemo } from "react";

import { MessageReactions } from "./MessageReactions.types";

const MAX_REACTION_EMOJIS_SHOWN = 3;

type ReactionDetails = {
  content: string;
  count: number;
  userReacted: boolean;
  reactors: string[];
  firstReactionTime: number;
};

type RolledUpReactions = {
  emojis: string[];
  totalReactions: number;
  userReacted: boolean;
  details: { [content: string]: ReactionDetails };
};

export function useMessageReactionsRolledup(arg: {
  reactions: MessageReactions;
  userAddress: string;
}) {
  const { reactions, userAddress } = arg;

  return useMemo((): RolledUpReactions => {
    const details: { [content: string]: ReactionDetails } = {};
    let totalReactions = 0;
    let userReacted = false;

    Object.values(reactions).forEach((reactionArray) => {
      reactionArray.forEach((reaction) => {
        if (!details[reaction.content]) {
          details[reaction.content] = {
            content: reaction.content,
            count: 0,
            userReacted: false,
            reactors: [],
            firstReactionTime: reaction.sent,
          };
        }
        details[reaction.content].count++;
        details[reaction.content].reactors.push(reaction.senderAddress);
        if (
          reaction.senderAddress.toLowerCase() === userAddress?.toLowerCase()
        ) {
          details[reaction.content].userReacted = true;
          userReacted = true;
        }
        // Keep track of the earliest reaction time for this emoji
        details[reaction.content].firstReactionTime = Math.min(
          details[reaction.content].firstReactionTime,
          reaction.sent
        );
        totalReactions++;
      });
    });

    // Sort by the number of reactors in descending order
    const sortedReactions = Object.values(details)
      .sort((a, b) => b.reactors.length - a.reactors.length)
      .slice(0, MAX_REACTION_EMOJIS_SHOWN)
      .map((reaction) => reaction.content);

    return { emojis: sortedReactions, totalReactions, userReacted, details };
  }, [reactions, userAddress]);
}
