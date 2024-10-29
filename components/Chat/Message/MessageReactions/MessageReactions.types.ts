import { MessageReaction } from "@utils/reactions";

export type MessageReactions = {
  [senderAddress: string]: MessageReaction[];
};

/**
 * Aggregated reaction data including top emojis, total count, and detailed breakdown.
 */
export type RolledUpReactions = {
  totalCount: number;
  userReacted: boolean;
  detailed: DetailedReaction[];
  preview: {
    content: string;
  }[];
};

/**
 * Details for each individual reaction emoji, including reactors and timing.
 */
export type DetailedReaction = {
  content: string;
  isOwnReaction: boolean;
  firstReactionTime: number;
  reactors: ReactorDetails[];
  count: number;
};

/**
 * Details of each reactor for a specific emoji.
 */
export type ReactorDetails = {
  address: string;
  userName?: string;
  avatar?: string;
  reactionTime: number;
};
