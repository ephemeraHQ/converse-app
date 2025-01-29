import { getConversationsQueryOptions } from "@/queries/use-conversations-query";
import { useCurrentAccount } from "@data/store/accountsStore";
import { useQuery } from "@tanstack/react-query";

export const useAllowedConversationsCount = () => {
  const account = useCurrentAccount();

  const { data: count, isLoading } = useQuery({
    ...getConversationsQueryOptions({
      account: account!,
      caller: "useConversationsCount",
    }),
    select: (data) => data?.length ?? 0,
  });

  return { count, isLoading };
};
