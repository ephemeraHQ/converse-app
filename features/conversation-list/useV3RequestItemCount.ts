import { useCurrentAccount } from "@data/store/accountsStore";
import { useV3ConversationListQuery } from "@queries/useV3ConversationListQuery";
import { useMemo } from "react";

export const useV3RequestItemCount = () => {
  const currentAccount = useCurrentAccount();
  const { data: groups } = useV3ConversationListQuery(
    currentAccount!,
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
    "useV3RequestItemCount"
  );

  const requestGroupCount = useMemo(() => {
    return groups?.filter((group) => group.state === "unknown").length ?? 0;
  }, [groups]);

  return requestGroupCount;
};
