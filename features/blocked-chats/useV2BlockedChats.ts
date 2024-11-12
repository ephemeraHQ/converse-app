import { useChatStore } from "@data/store/accountsStore";

export const useV2BlockedChats = () => {
  const conversations = useChatStore((s) => s.sortedConversationsWithPreview);
  return conversations.conversationsBlocked;
};
