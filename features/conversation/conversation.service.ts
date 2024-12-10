import { useConversationStoreContext } from "./conversation.store-context";

export function useCurrentConversationTopic() {
  return useConversationStoreContext((state) => state.topic);
}

export function useConversationCurrentConversationId() {
  return useConversationStoreContext((state) => state.conversationId);
}
