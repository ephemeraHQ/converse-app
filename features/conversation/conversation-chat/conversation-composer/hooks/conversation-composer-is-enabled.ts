import {
  useConversationStoreContext,
  useCurrentXmtpConversationId,
} from "@/features/conversation/conversation-chat/conversation.store-context"

export function useConversationComposerIsEnabled() {
  const isCreatingNewConversation = useConversationStoreContext(
    (state) => state.isCreatingNewConversation,
  )
  const topic = useCurrentXmtpConversationId()
  const searchSelectedUserInboxIds = useConversationStoreContext(
    (state) => state.searchSelectedUserInboxIds,
  )

  return !isCreatingNewConversation || !!topic || !!searchSelectedUserInboxIds
}
