import { useGroupQuery } from "@queries/useGroupQuery";

import { currentAccount } from "../data/store/accountsStore";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { useQuery } from "@tanstack/react-query";

export const useGroupCreator = (topic: ConversationTopic | undefined) => {
  const account = currentAccount();
  const { data } = useGroupQuery(account, topic);

  return useQuery({
    queryKey: [account, "groupCreator", topic],
    queryFn: () => {
      if (!data) return null;
      data?.creatorInboxId;
    },
    enabled: !!topic && !!data,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
