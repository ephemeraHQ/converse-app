import { useChatStore } from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";
import { useCallback } from "react";

export const usePinnedConversationLongPress = (topic: string) => {
  const { setPinnedConversations } = useChatStore(
    useSelect(["setPinnedConversations"])
  );

  return useCallback(() => {
    setPinnedConversations([topic]);
  }, [setPinnedConversations, topic]);
};
