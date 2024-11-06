import { useCurrentAccount } from "@data/store/accountsStore";
import { useV3ConversationListQuery } from "@queries/useV3ConversationListQuery";
import { useMemo } from "react";

export const useConversationListGroupItem = (topic: string) => {
  const account = useCurrentAccount();
  const { data } = useV3ConversationListQuery(
    account!,
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
    "useConversationListGroupItem"
  );

  return useMemo(
    () => data?.find((group) => group.topic === topic),
    [data, topic]
  );
};
