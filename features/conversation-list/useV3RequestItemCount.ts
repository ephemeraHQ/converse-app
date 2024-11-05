import { useCurrentAccount } from "@data/store/accountsStore";
import { useGroupsConversationListQuery } from "@queries/useGroupsConversationListQuery";
import { useMemo } from "react";

export const useV3RequestItemCount = () => {
  const currentAccount = useCurrentAccount();
  const { data: groups } = useGroupsConversationListQuery(currentAccount!);

  const requestGroupCount = useMemo(() => {
    return groups?.filter((group) => group.state === "unknown").length ?? 0;
  }, [groups]);

  return requestGroupCount;
};
