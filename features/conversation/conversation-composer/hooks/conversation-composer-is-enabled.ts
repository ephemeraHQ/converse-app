import {
  useConversationStoreContext,
  useCurrentConversationTopic,
} from "@/features/conversation/conversation.store-context";

export function useConversationComposerIsEnabled() {
  const isCreatingNewConversation = useConversationStoreContext(
    (state) => state.isCreatingNewConversation
  );
  const topic = useCurrentConversationTopic();
  const searchSelectedUserInboxIds = useConversationStoreContext(
    (state) => state.searchSelectedUserInboxIds
  );

  return !isCreatingNewConversation || !!topic || !!searchSelectedUserInboxIds;
}
