import { useQueries, useQuery } from "@tanstack/react-query"
import { useEffect, useMemo } from "react"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { prefetchConversationMessages } from "@/features/conversation/conversation-chat/conversation-messages.query"
import { getAllowedConsentConversationsQueryOptions } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import { getConversationMetadataQueryOptions } from "@/features/conversation/conversation-metadata/conversation-metadata.query"
import { isConversationAllowed } from "@/features/conversation/utils/is-conversation-allowed"
import { captureError } from "@/utils/capture-error"

export const useConversationListConversations = () => {
  const currentSender = useSafeCurrentSender()

  const {
    data: conversations,
    refetch,
    isLoading: isLoadingConversations,
  } = useQuery(
    getAllowedConsentConversationsQueryOptions({
      inboxId: currentSender.inboxId,
      caller: "useConversationListConversations",
    }),
  )

  // Let's prefetch the messages for all the conversations
  useEffect(() => {
    if (conversations) {
      for (const conversation of conversations) {
        prefetchConversationMessages({
          clientInboxId: currentSender.inboxId,
          topic: conversation.topic,
          caller: "useConversationListConversations",
        }).catch(captureError)
      }
    }
  }, [conversations, currentSender])

  const conversationsMetadataQueries = useQueries({
    queries: (conversations ?? []).map((conversation) =>
      getConversationMetadataQueryOptions({
        clientInboxId: currentSender.inboxId,
        topic: conversation.topic,
      }),
    ),
    // note/todo(lustig): investigate combine to remove need for filteredConvresations (which utilizes conversationsDataQueries)
    // which is referentially unstable
    // combine: (queries) => {
    //   queries.forEach((query) => {
    //     if (query) {
    //       isConversationAllowed(query.data);
    //     }
    //   });
    // },
  })

  const filteredAndSortedConversations = useMemo(() => {
    if (!conversations) return []

    // Filter out conversations that don't meet criteria
    const filtered = conversations.filter((conversation, index) => {
      const query = conversationsMetadataQueries[index]
      const isAllowed = isConversationAllowed(conversation)
      const isPinned = query?.data?.pinned
      const isDeleted = query?.data?.deleted
      const isLoading = query?.isLoading

      return isAllowed && !isPinned && !isDeleted && !isLoading
    })

    // Sort by timestamp descending (newest first)
    return filtered.sort((a, b) => {
      const timestampA = a.lastMessage?.sentNs ?? 0
      const timestampB = b.lastMessage?.sentNs ?? 0
      return timestampB - timestampA
    })

    /*
     * note(lustig): potential fix using existing libraries could be exploring `combine` above
     * es lint from @tanstack/query/no-unstable-deps
     *
     * lint error: The result of useQueries is not referentially stable, so don't pass it
     * directly into the dependencies array of useMemo. Instead, destructure
     * the return value of useQueries and pass the destructured values into
     * the dependency array of useMemo.eslint@tanstack/query/no-unstable-deps
     */
  }, [conversations, conversationsMetadataQueries])

  const isLoading = useMemo(() => {
    return isLoadingConversations || conversationsMetadataQueries.some((query) => query.isLoading)
  }, [isLoadingConversations, conversationsMetadataQueries])

  return { data: filteredAndSortedConversations, refetch, isLoading }
}
