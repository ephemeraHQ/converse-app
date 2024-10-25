import { MessageReaction } from "@utils/reactions";

export type MessageReactions = {
  [senderAddress: string]: MessageReaction[];
};

/**
 * Aggregated reaction data including top emojis, total count, and detailed breakdown.
 */
export type RolledUpReactions = {
  emojis: string[];
  totalReactions: number;
  userReacted: boolean;
  details: Record<string, ReactionDetails>;
};

/**
 * Details for a specific reaction emoji, including count, reactors, and timing.
 */
export type ReactionDetails = {
  content: string;
  count: number;
  userReacted: boolean;
  reactors: string[];
  firstReactionTime: number;
};
