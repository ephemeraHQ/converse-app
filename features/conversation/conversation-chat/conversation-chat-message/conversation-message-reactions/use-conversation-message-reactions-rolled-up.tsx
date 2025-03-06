import { MessageId } from "@xmtp/react-native-sdk"
import { useMemo } from "react"
import { isCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useConversationMessageReactions } from "@/features/conversation/conversation-chat/conversation-chat-message/conversation-message.utils"
import { usePreferredDisplayInfoBatch } from "@/features/preferred-display-info/use-preferred-display-info-batch"
import { RolledUpReactions, SortedReaction } from "./conversation-message-reactions.types"

export function useConversationMessageReactionsRolledUp(args: { messageId: MessageId }) {
  const { messageId } = args

  const { bySender: reactionsBySender } = useConversationMessageReactions(messageId)

  const inboxIds = Array.from(
    new Set(Object.entries(reactionsBySender ?? {}).map(([senderInboxId]) => senderInboxId)),
  )

  const preferredDisplayData = usePreferredDisplayInfoBatch({
    xmtpInboxIds: inboxIds,
  })

  return useMemo((): RolledUpReactions => {
    const detailed: SortedReaction[] = []
    let totalCount = 0
    let userReacted = false

    // Flatten reactions and track sender addresses
    const flatReactions = Object.entries(reactionsBySender ?? {}).flatMap(
      ([senderInboxId, senderReactions]) =>
        senderReactions.map((reaction) => ({ senderInboxId, ...reaction })),
    )
    totalCount = flatReactions.length

    // Track reaction counts for preview
    const previewCounts = new Map<string, number>()

    flatReactions.forEach((reaction) => {
      const isOwnReaction = isCurrentSender({
        inboxId: reaction.senderInboxId,
      })

      if (isOwnReaction) {
        userReacted = true
      }

      // Count reactions for the preview
      previewCounts.set(reaction.content, (previewCounts.get(reaction.content) || 0) + 1)

      const profile = preferredDisplayData?.[inboxIds.indexOf(reaction.senderInboxId)]

      detailed.push({
        content: reaction.content,
        isOwnReaction,
        reactor: {
          address: reaction.senderInboxId,
          username: profile?.displayName,
          avatar: profile?.avatarUrl,
        },
      })
    })

    // Sort detailed array to place all OWN reactions at the beginning
    detailed.sort((a, b) => Number(b.isOwnReaction) - Number(a.isOwnReaction))

    // Convert previewCounts map to array with content and count
    const preview = Array.from(previewCounts, ([content, count]) => ({
      content,
      count,
    }))

    return {
      messageId,
      totalCount,
      userReacted,
      preview,
      detailed,
    }
  }, [reactionsBySender, preferredDisplayData, messageId, inboxIds])
}
