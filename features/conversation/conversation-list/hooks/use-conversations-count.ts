import { useQuery } from "@tanstack/react-query"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { getAllowedConsentConversationsQueryOptions } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"

export const useAllowedConversationsCount = () => {
  const currentSender = useSafeCurrentSender()

  const { data: count, isLoading } = useQuery({
    ...getAllowedConsentConversationsQueryOptions({
      clientInboxId: currentSender.inboxId,
      caller: "useConversationsCount",
    }),
    select: (data) => data?.length ?? 0,
  })

  return { count, isLoading }
}
