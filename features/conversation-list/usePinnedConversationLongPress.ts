import { useChatStore, useCurrentAccount } from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";
import { pinTopics, unpinTopics } from "@utils/api";
import { useCallback } from "react";

export const usePinnedConversationLongPress = (topic: string) => {
  const currentAccount = useCurrentAccount();
  const { setPinnedConversations, pinnedConversationTopics } = useChatStore(
    useSelect(["setPinnedConversations", "pinnedConversationTopics"])
  );

  return useCallback(() => {
    setPinnedConversations([topic]);
    const exists = pinnedConversationTopics.includes(topic);
    if (exists) {
      unpinTopics(currentAccount!, [topic]);
    } else {
      pinTopics(currentAccount!, [topic]);
    }
  }, [setPinnedConversations, topic, pinnedConversationTopics, currentAccount]);
};
