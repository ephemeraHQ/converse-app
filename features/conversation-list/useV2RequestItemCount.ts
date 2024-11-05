import { useMemo } from "react";
import { useChatStore } from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";
import { sortRequestsBySpamScore } from "@utils/xmtpRN/conversations";

export const useV2RequestItemCount = () => {
  const { sortedConversationsWithPreview } = useChatStore(
    useSelect(["sortedConversationsWithPreview"])
  );

  const requestsCount = useMemo(() => {
    const { likelyNotSpam } = sortRequestsBySpamScore(
      sortedConversationsWithPreview.conversationsRequests
    );
    return likelyNotSpam.length;
  }, [sortedConversationsWithPreview.conversationsRequests]);

  return requestsCount;
};
