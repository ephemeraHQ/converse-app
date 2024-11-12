import { useGroupQuery } from "@queries/useGroupQuery";
import { useQuery } from "@tanstack/react-query";

import { currentAccount } from "../data/store/accountsStore";

export const useGroupCreator = (topic: string) => {
  const account = currentAccount();
  const { data } = useGroupQuery(account, topic);

  return useQuery({
    queryKey: ["groupCreator", account, topic],
    queryFn: async () => {
      const creatorInboxId = await data?.creatorInboxId();
      return creatorInboxId ?? null;
    },
    enabled: !!account && !!topic && !!data,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
  });
};
