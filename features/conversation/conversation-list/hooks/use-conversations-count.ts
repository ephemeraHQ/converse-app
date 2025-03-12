import { useQuery } from "@tanstack/react-query"
import { useCurrentSenderEthAddress } from "@/features/authentication/multi-inbox.store"
import { getAllowedConsentConversationsQueryOptions } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"

export const useAllowedConversationsCount = () => {
  const account = useCurrentSenderEthAddress()

  const { data: count, isLoading } = useQuery({
    ...getAllowedConsentConversationsQueryOptions({
      inboxId: account!,
      caller: "useConversationsCount",
    }),
    select: (data) => data?.length ?? 0,
  })

  return { count, isLoading }
}
