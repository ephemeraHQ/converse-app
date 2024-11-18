import { useCurrentAccount } from "@data/store/accountsStore";
import { useTopicsData } from "@hooks/useTopicsData";
import { useV3ConversationListQuery } from "@queries/useV3ConversationListQuery";
import { useMemo } from "react";

export const useV3BlockedChats = () => {
  const currentAccount = useCurrentAccount();
  const topicsData = useTopicsData();
  const { data, ...rest } = useV3ConversationListQuery(
    currentAccount!,
    {
      refetchOnMount: false,
    },
    "useV3BlockedChats"
  );

  const blockedConversations = useMemo(() => {
    return data?.filter((convo) => {
      const topicData = topicsData[convo.topic];
      return topicData?.status === "deleted" || convo.state === "denied";
    });
  }, [data, topicsData]);

  return { data: blockedConversations, ...rest };
};
