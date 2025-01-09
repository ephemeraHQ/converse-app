import { useTopicsData } from "@hooks/useTopicsData";
import { useConversationListForCurrentUserQuery } from "@/queries/useConversationListQuery";
import { useMemo } from "react";

export const useV3BlockedChats = () => {
  const topicsData = useTopicsData();
  const { data, ...rest } = useConversationListForCurrentUserQuery({
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
