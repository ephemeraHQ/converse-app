import { useConversationListQuery } from "@/queries/useConversationListQuery";
import { useCurrentAccount } from "@data/store/accountsStore";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { useMemo } from "react";

export const useConversationListGroupItem = (topic: ConversationTopic) => {
  const account = useCurrentAccount();
  const { data } = useConversationListQuery({
    account: account!,
    queryOptions: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },

    context: "useConversationListGroupItem",
  });

  return useMemo(
    () => data?.find((group) => group.topic === topic),
    [data, topic]
  );
};
