import { useConversationsQuery } from "@/queries/conversations-query";
import { useCurrentAccount } from "@data/store/accountsStore";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { useMemo } from "react";

export const useConversationByTopic = (topic: ConversationTopic) => {
  const account = useCurrentAccount();

  const { data: conversations } = useConversationsQuery({
    account: account!,
    context: "useConversationListConversation",
  });

  return useMemo(
    () => conversations?.find((c) => c.topic === topic),
    [conversations, topic]
  );
};
