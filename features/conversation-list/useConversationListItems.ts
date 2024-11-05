import { mergeOrderedLists } from "@utils/mergeLists";
import { useV2ConversationItems } from "./useV2ConversationItems";
import { useV3ConversationItems } from "./useV3ConversationItems";
import { useMemo } from "react";

export const useConversationListItems = () => {
  const { items: v2Items, initialLoadDoneOnce } = useV2ConversationItems();
  const { data: v3Items, isLoading, ...rest } = useV3ConversationItems();

  const items = useMemo(() => {
    return mergeOrderedLists(
      v2Items,
      v3Items ?? [],
      (a) =>
        "lastMessagePreview" in a
          ? a.lastMessagePreview?.message?.sent ?? 0
          : 0,
      (b) => b.lastMessage?.sent ?? 0
    );
  }, [v2Items, v3Items]);

  return {
    ...rest,
    isLoading: isLoading || !initialLoadDoneOnce,
    data: items,
  };
};
