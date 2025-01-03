import { useCurrentAccount } from "@data/store/accountsStore";
import { useTopicsData } from "@hooks/useTopicsData";
import { useConversationListQuery } from "@/queries/useConversationListQuery";
import { useMemo } from "react";

export const useV3BlockedChats = () => {
  const currentAccount = useCurrentAccount();
  const topicsData = useTopicsData();
  const { data, ...rest } = useConversationListQuery({
    account: currentAccount!,
    queryOptions: {
      refetchOnMount: false,
    },
    context: "useV3BlockedChats",
  });

  const blockedConversations = useMemo(() => {
    return data?.filter((convo) => {
      const topicData = topicsData[convo.topic];
      return topicData?.status === "deleted" || convo.state === "denied";
    });
  }, [data, topicsData]);

  return { data: blockedConversations, ...rest };
};
