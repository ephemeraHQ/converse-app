import { useCurrentAccount } from "@data/store/accountsStore";
import { useConversationListForCurrentUserQuery } from "@/queries/useConversationListForCurrentUserQuery";
import { useMemo } from "react";

export const useV3RequestItemCount = () => {
  const currentInboxId = useCurrentInboxId()();
  const { data: groups } = useConversationListForCurrentUserQuery({
    account: currentAccount!,
    queryOptions: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
    context: "useV3RequestItemCount",
  });

  const requestGroupCount = useMemo(() => {
    return groups?.filter((group) => group.state === "unknown").length ?? 0;
  }, [groups]);

  return requestGroupCount;
};
