import { MessageReaction } from "../../../../utils/reactions";

export type MessageReactions = {
  [senderAddress: string]: MessageReaction[];
};

export type RolledUpReactions = {
  emojis: string[];
  totalReactions: number;
  userReacted: boolean;
  details: { [content: string]: ReactionDetails };
};

export type ReactionDetails = {
  content: string;
  count: number;
  userReacted: boolean;
  reactors: string[];
  firstReactionTime: number;
};
