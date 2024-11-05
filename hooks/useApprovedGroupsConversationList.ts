import { useCurrentAccount } from "@data/store/accountsStore";
import { useGroupsConversationListQuery } from "@queries/useGroupsConversationListQuery";
import { useMemo } from "react";

export const useApprovedGroupsConversationList = () => {
  const userAddress = useCurrentAccount()!;
  const { data, ...rest } = useGroupsConversationListQuery(userAddress);
  const filtered = useMemo(() => {
    return data?.filter((group) => {
      return group?.state === "allowed";
    });
  }, [data]);

  return { data: filtered, ...rest };
};
