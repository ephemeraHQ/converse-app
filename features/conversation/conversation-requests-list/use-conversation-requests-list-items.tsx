import { useQueries, useQuery } from "@tanstack/react-query"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { getUnknownConsentConversationsQueryOptions } from "@/features/conversation/conversation-requests-list/conversations-unknown-consent.query"
import { getMessageSpamScore } from "@/features/conversation/conversation-requests-list/utils/get-message-spam-score"
import { getConversationQueryData } from "@/features/conversation/queries/conversation.query"
import { captureError } from "@/utils/capture-error"
import { getMessageContentStringValue } from "../conversation-chat/conversation-message/utils/get-message-string-content"

export function useConversationRequestsListItem() {
  const currentSender = useSafeCurrentSender()

  // 1. First get the conversation IDs for unknown consent conversations
  const { data: conversationIds, isLoading: isLoadingConversationIds } = useQuery({
    ...getUnknownConsentConversationsQueryOptions({
      inboxId: currentSender.inboxId,
      caller: "useConversationRequestsListItem",
    }),
  })

  // 3. Check for spam scores based on conversation contents
  const spamQueries = useQueries({
    queries: (conversationIds ?? []).map((conversationId) => ({
      queryKey: ["is-spam", conversationId, currentSender.inboxId],
      queryFn: async () => {
        const conversation = getConversationQueryData({
          clientInboxId: currentSender.inboxId,
          xmtpConversationId: conversationId,
        })

        if (!conversation) {
          return true
        }

        const lastMessage = conversation.lastMessage

        if (!lastMessage) {
          return true
        }

        const messageText = getMessageContentStringValue(lastMessage.content)

        if (!messageText) {
          return true
        }

        try {
          const spamScore = await getMessageSpamScore({
            message: lastMessage,
          })
          const isSpam = spamScore !== 0
          return isSpam
        } catch (error) {
          captureError(error)
          return true
        }
      },
    })),
  })

  const isLoading = isLoadingConversationIds || spamQueries.some((q) => q.isLoading)

  const spamResults =
    conversationIds?.map((conversationId, i) => ({
      conversationId,
      isSpam: spamQueries[i].data ?? true,
    })) ?? []

  return {
    likelyNotSpamConversationIds:
      spamResults.filter((r) => !r.isSpam).map((r) => r.conversationId) ?? [],
    likelySpamConversationIds:
      spamResults.filter((r) => r.isSpam).map((r) => r.conversationId) ?? [],
    isLoading,
  }
}
