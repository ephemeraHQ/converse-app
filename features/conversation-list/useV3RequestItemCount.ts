import { useConversationListForCurrentUserQuery } from "@/queries/useConversationListQuery";
import { useMemo } from "react";

export const useV3RequestItemCount = () => {
  const { data: groups } = useConversationListForCurrentUserQuery({
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
