import { useCurrentAccount } from "@data/store/accountsStore";
import { useGroupsConversationListQuery } from "@queries/useGroupsConversationListQuery";
import { useMemo } from "react";

export const useConversationListGroupItem = (topic: string) => {
  const account = useCurrentAccount();
  const { data } = useGroupsConversationListQuery(account!, {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return useMemo(() => data?.byId[topic], [data, topic]);
};
