import { useConversationListQuery } from "@/queries/useConversationListQuery";
import { useCurrentAccount } from "@data/store/accountsStore";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { useMemo } from "react";

export const useConversationByTopic = (topic: ConversationTopic) => {
  const account = useCurrentAccount();

  const { data: conversations } = useConversationListQuery({
    account: account!,
    queryOptions: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
    context: "useConversationListConversation",
  });

  return useMemo(
    () => conversations?.find((c) => c.topic === topic),
    [conversations, topic]
  );
};
