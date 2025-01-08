import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { useMemo } from "react";
import { useConversationListForCurrentUserQuery } from "@/queries/useConversationListQuery";
export const useConversationListGroupItem = (topic: ConversationTopic) => {
  const { data } = useConversationListForCurrentUserQuery({
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
