import { useQuery } from "@tanstack/react-query";
import { useCurrentSenderEthAddress } from "@/features/authentication/multi-inbox.store";
import { getAllowedConsentConversationsQueryOptions } from "@/queries/conversations-allowed-consent-query";

export const useAllowedConversationsCount = () => {
  const account = useCurrentSenderEthAddress();

  const { data: count, isLoading } = useQuery({
    ...getAllowedConsentConversationsQueryOptions({
      account: account!,
      caller: "useConversationsCount",
    }),
    select: (data) => data?.length ?? 0,
  });

  return { count, isLoading };
};
