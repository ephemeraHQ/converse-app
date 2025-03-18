import { useQueries } from "@tanstack/react-query"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useAllowedConsentConversationsQuery } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import { getConversationMetadataQueryOptions } from "@/features/conversation/conversation-metadata/conversation-metadata.query"
import { getConversationQueryData } from "@/features/conversation/queries/conversation.query"
import { isConversationDenied } from "@/features/conversation/utils/is-conversation-denied"

export const useBlockedConversationsForCurrentAccount = () => {
  const currentSender = useSafeCurrentSender()

  const { data: conversationIds } = useAllowedConsentConversationsQuery({
    clientInboxId: currentSender.inboxId,
    caller: "useBlockedConversationsForCurrentAccount",
  })

  const conversationsMetadataQueries = useQueries({
    queries: (conversationIds ?? []).map((conversationId) =>
      getConversationMetadataQueryOptions({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId: conversationId,
      }),
    ),
    combine: (queries) => {
      const blockedConversations = (conversationIds ?? []).filter((conversationId, index) => {
        const query = queries[index]
        const conversation = getConversationQueryData({
          clientInboxId: currentSender.inboxId,
          xmtpConversationId: conversationId,
        })
        return query.data?.deleted || (conversation && isConversationDenied(conversation))
      })

      return {
        data: blockedConversations,
      }
    },
  })

  return {
    data: conversationsMetadataQueries.data || [],
  }
}
