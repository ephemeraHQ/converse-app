import { useQueries, useQuery } from "@tanstack/react-query"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { getUnknownConsentConversationsQueryOptions } from "@/features/conversation/conversation-requests-list/conversations-unknown-consent.query"
import { getMessageSpamScore } from "@/features/conversation/conversation-requests-list/utils/get-message-spam-score"
import { captureError } from "@/utils/capture-error"
import { getMessageContentStringValue } from "../conversation-chat/conversation-message/utils/get-message-string-content"

export function useConversationRequestsListItem() {
  const currentSenderInboxId = useSafeCurrentSender().inboxId

  const { data: unkownConsentConversations, isLoading: unkownConsentConversationsLoading } =
    useQuery({
      ...getUnknownConsentConversationsQueryOptions({
        inboxId: currentSenderInboxId,
        caller: "useConversationRequestsListItem",
      }),
    })

  const spamQueries = useQueries({
    queries: (unkownConsentConversations ?? []).map((conversation) => ({
      queryKey: ["is-spam", conversation.xmtpTopic],
      queryFn: async () => {
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
      enabled: !!conversation.lastMessage,
    })),
  })

  const isLoading = unkownConsentConversationsLoading || spamQueries.some((q) => q.isLoading)

  const spamResults = spamQueries
    .map((q, i) => ({
      conversation: unkownConsentConversations?.[i],
      isSpam: q.data ?? true,
    }))
    .filter((r) => !!r.conversation)

  return {
    likelyNotSpam:
      spamResults
        .filter((r) => !r.isSpam)
        .map(
          (r) =>
            // ! because we do .filter above
            r.conversation!,
        ) ?? [],
    likelySpam:
      spamResults
        .filter((r) => r.isSpam)
        .map(
          (r) =>
            // ! because we do .filter above
            r.conversation!,
        ) ?? [],
    isLoading,
  }
}
