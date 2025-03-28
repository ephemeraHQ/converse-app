import { useQueries, useQuery } from "@tanstack/react-query"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { getUnknownConsentConversationsQueryOptions } from "@/features/conversation/conversation-requests-list/conversations-unknown-consent.query"
import { getMessageSpamScore } from "@/features/conversation/conversation-requests-list/utils/get-message-spam-score"
import { ensureConversationQueryData } from "@/features/conversation/queries/conversation.query"
import { captureError } from "@/utils/capture-error"
import { GenericError } from "@/utils/error"
import { ensureMessageContentStringValue } from "../conversation-list/hooks/use-message-content-string-value"

export function useConversationRequestsListItem() {
  const currentSender = useSafeCurrentSender()

  const {
    data: unknownConsentConversationIds,
    isLoading: isLoadingUnknownConsentConversationIds,
    refetch: refetchUnknownConsentConversationIds,
  } = useQuery({
    ...getUnknownConsentConversationsQueryOptions({
      inboxId: currentSender.inboxId,
      caller: "useConversationRequestsListItem",
    }),
  })

  const spamQueries = useQueries({
    queries: (unknownConsentConversationIds ?? []).map((conversationId) => ({
      queryKey: ["is-spam", conversationId, currentSender.inboxId],
      queryFn: async () => {
        try {
          const conversation = await ensureConversationQueryData({
            clientInboxId: currentSender.inboxId,
            xmtpConversationId: conversationId,
            caller: "useConversationRequestsListItem",
          })

          if (!conversation) {
            throw new Error("Conversation not found")
          }

          const lastMessage = conversation.lastMessage

          if (!lastMessage) {
            throw new Error("No last message found")
          }

          const messageText = await ensureMessageContentStringValue(lastMessage)

          if (!messageText) {
            throw new Error("No message text found")
          }

          const spamScore = await getMessageSpamScore({
            message: lastMessage,
          })
          const isSpam = spamScore !== 0
          return isSpam
        } catch (error) {
          captureError(new GenericError({ error, additionalMessage: "Error checking spam score" }))
          return true
        }
      },
    })),
  })

  const isLoading = isLoadingUnknownConsentConversationIds || spamQueries.some((q) => q.isLoading)

  const spamResults =
    unknownConsentConversationIds?.map((conversationId, i) => ({
      conversationId,
      isSpam: spamQueries[i].data ?? true,
    })) ?? []

  return {
    likelyNotSpamConversationIds:
      spamResults.filter((r) => !r.isSpam).map((r) => r.conversationId) ?? [],
    likelySpamConversationIds:
      spamResults.filter((r) => r.isSpam).map((r) => r.conversationId) ?? [],
    isLoading,
    refetch: refetchUnknownConsentConversationIds,
  }
}
