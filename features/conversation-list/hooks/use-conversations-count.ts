import { getConversationsQueryOptions } from "@/queries/conversations-query";
import { useCurrentAccount } from "@data/store/accountsStore";
import { useQuery } from "@tanstack/react-query";

export const useConversationsCount = () => {
  const account = useCurrentAccount();

  const { data: count, isLoading } = useQuery({
    ...getConversationsQueryOptions({
      account: account!,
    }),
    select: (data) => data?.length ?? 0,
  });

  return { count, isLoading };
};
