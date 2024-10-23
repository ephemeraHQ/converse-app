import { useCurrentAccount } from "@data/store/accountsStore";
import { useGroupsConversationListQuery } from "@queries/useGroupsConversationListQuery";
import { useMemo } from "react";

export const useApprovedGroupsConversationList = () => {
  const userAddress = useCurrentAccount()!;
  const { data, ...rest } = useGroupsConversationListQuery(userAddress);
  const filtered = useMemo(() => {
    return {
      ids: data?.ids?.filter((a) => {
        const group = data.byId[a];
        return group?.state === "allowed";
      }),
      byId: data?.byId,
    };
  }, [data]);

  return { data: filtered, ...rest };
};
