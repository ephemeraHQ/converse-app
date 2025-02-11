import { getAllowedConsentConversationsQueryOptions } from "@/queries/conversations-allowed-consent-query";
import { useCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import { useQuery } from "@tanstack/react-query";

export const useAllowedConversationsCount = () => {
  const account = useCurrentAccount();

  const { data: count, isLoading } = useQuery({
    ...getAllowedConsentConversationsQueryOptions({
      account: account!,
      caller: "useConversationsCount",
    }),
    select: (data) => data?.length ?? 0,
  });

  return { count, isLoading };
};
