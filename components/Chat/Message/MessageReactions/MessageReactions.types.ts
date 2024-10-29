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
  preview: {
    content: string;
    count: number;
  }[];
  detailed: SortedReaction[];
};

/**
 * Details for each individual reaction emoji, including reactors and timing.
 */
export type SortedReaction = {
  content: string;
  isOwnReaction: boolean;
  firstReactionTime: number;
  reactor: ReactorDetails;
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
