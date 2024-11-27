import { useGroupQuery } from "@queries/useGroupQuery";
import { useQuery } from "@tanstack/react-query";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { currentAccount } from "../data/store/accountsStore";

export const useGroupCreator = (topic: ConversationTopic) => {
  const account = currentAccount();
  const { data } = useGroupQuery(account, topic);

  return useQuery({
    queryKey: [account, "groupCreator", topic],
    queryFn: () => {
      if (!data) return null;
      return data.creatorInboxId();
    },
    enabled: !!topic && !!data,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
