import { useChatStore } from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";
import { sortRequestsBySpamScore } from "@utils/xmtpRN/conversations";
import { useMemo } from "react";

export const useV2RequestItems = () => {
  const { sortedConversationsWithPreview } = useChatStore(
    useSelect(["sortedConversationsWithPreview"])
  );
  const allRequests = sortedConversationsWithPreview.conversationsRequests;

  return useMemo(() => sortRequestsBySpamScore(allRequests), [allRequests]);
};
