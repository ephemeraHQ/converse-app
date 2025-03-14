import { Nullable } from "@/types/general"
import { IConversationMessageId } from "../conversation-message.types"

/**
 * Aggregated reaction data including top emojis, total count, and detailed breakdown.
 */
export type RolledUpReactions = {
  totalCount: number
  userReacted: boolean
  preview: ReactionPreview[]
  detailed: SortedReaction[]
  messageId: IConversationMessageId
}

/**
 * Basic reaction information for preview displays.
 */
export type ReactionPreview = {
  content: string
  count: number
}

/**
 * Details for each individual reaction emoji, including reactors and timing.
 */
export type SortedReaction = {
  content: string
  isOwnReaction: boolean
  reactor: ReactorDetails
}

/**
 * Details of each reactor for a specific emoji.
 */
export type ReactorDetails = {
  address: string
  username: Nullable<string>
  avatar: Nullable<string>
}
