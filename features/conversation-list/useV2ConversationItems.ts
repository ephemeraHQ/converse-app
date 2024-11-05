import { useChatStore } from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";

export const useV2ConversationItems = () => {
  const { sortedConversationsWithPreview, initialLoadDoneOnce } = useChatStore(
    useSelect(["sortedConversationsWithPreview", "initialLoadDoneOnce"])
  );

  return {
    items: sortedConversationsWithPreview.conversationsInbox,
    initialLoadDoneOnce,
  };
};
