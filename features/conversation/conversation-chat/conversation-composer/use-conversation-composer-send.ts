import { useCallback } from "react"
import { useConversationStore } from "@/features/conversation/conversation-chat/conversation.store-context"
import { useCreateConversationAndSendFirstMessageMutation } from "@/features/conversation/conversation-create/mutations/create-conversation-and-send-first-message.mutation"
import { ISendMessageParams, useSendMessage } from "@/features/conversation/hooks/use-send-message"
import { FeedbackError } from "@/utils/error"
import { waitUntilPromise } from "@/utils/wait-until-promise"
import { useConversationComposerStore } from "./conversation-composer.store-context"

/**
 * Main hook for handling message sending in the conversation composer
 * Consolidates all sending logic in one place for better readability
 */
export function useConversationComposerSend() {
  const composerStore = useConversationComposerStore()
  const conversationStore = useConversationStore()
  const { sendMessage } = useSendMessage()
  const createConversationAndSendFirstMessageMutation =
    useCreateConversationAndSendFirstMessageMutation()

  const send = useCallback(async () => {
    const { inputValue, replyingToMessageId, composerUploadedAttachments, composerMediaPreviews } =
      composerStore.getState()
    const { xmtpConversationId, searchSelectedUserInboxIds } = conversationStore.getState()

    try {
      await waitUntilPromise({
        checkFn: () =>
          composerMediaPreviews.every((preview) => !preview || preview.status === "uploaded"),
      })
    } catch (error) {
      throw new FeedbackError({
        error,
        additionalMessage: "Failed to upload media",
      })
    }

    // Reset composer state before sending to prevent duplicate sends
    composerStore.getState().reset()

    const messageContents: ISendMessageParams["contents"] = [
      // Text content
      ...(inputValue.length > 0 ? [{ text: inputValue }] : []),
      // Multiple remote attachments
      ...(composerUploadedAttachments.length > 1
        ? [{ attachments: composerUploadedAttachments }]
        : []),
      // Single remote attachment
      ...(composerUploadedAttachments.length === 1 ? [{ ...composerUploadedAttachments[0] }] : []),
    ]

    if (xmtpConversationId) {
      await sendMessage({
        contents: messageContents,
        xmtpConversationId,
        ...(replyingToMessageId && {
          replyXmtpMessageId: replyingToMessageId,
        }),
      })

      // For now this creates a small glitch because the whole conversation dissmount the new convo search bar and rerender messages.
      // Will need to fix later
      conversationStore.setState({ isCreatingNewConversation: false })
    } else {
      const { conversation: createdConversation } =
        await createConversationAndSendFirstMessageMutation.mutateAsync({
          inboxIds: searchSelectedUserInboxIds,
          contents: messageContents,
        })

      conversationStore.setState({
        xmtpConversationId: createdConversation.xmtpId,
        isCreatingNewConversation: false,
      })
    }
  }, [composerStore, conversationStore, createConversationAndSendFirstMessageMutation, sendMessage])

  return { send }
}
