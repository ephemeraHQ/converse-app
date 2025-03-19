import { useCallback } from "react"
import { useConversationStore } from "@/features/conversation/conversation-chat/conversation.store-context"
import { useCreateConversationAndSendFirstMessageMutation } from "@/features/conversation/conversation-create/mutations/create-conversation-and-send-first-message.mutation"
import {
  ISendMessageParams,
  useSendMessage,
} from "@/features/conversation/hooks/use-send-message.mutation"
import { FeedbackError } from "@/utils/error"
import { logJson } from "@/utils/logger"
import { waitUntilPromise } from "@/utils/wait-until-promise"
import { useConversationComposerStore } from "./conversation-composer.store-context"

/**
 * Main hook for handling message sending in the conversation composer
 * Consolidates all sending logic in one place for better readability
 */
export function useConversationComposerSend() {
  const composerStore = useConversationComposerStore()
  const conversationStore = useConversationStore()
  const sendMessageMutation = useSendMessage()
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

    // Create separate content arrays for normal messages and replies
    const messageContents: ISendMessageParams["contents"] = replyingToMessageId
      ? // Handling reply message - we need to create a proper reply structure for each content type
        [
          // Add text content as a reply if we have text
          ...(inputValue.length > 0
            ? [
                {
                  reference: replyingToMessageId,
                  content: { text: inputValue },
                },
              ]
            : []),

          // Add attachment content as replies
          ...(composerUploadedAttachments.length > 0
            ? composerUploadedAttachments.length === 1
              ? [
                  {
                    reference: replyingToMessageId,
                    content: { ...composerUploadedAttachments[0] },
                  },
                ]
              : [
                  {
                    reference: replyingToMessageId,
                    content: { attachments: composerUploadedAttachments },
                  },
                ]
            : []),
        ]
      : // Regular message structure - simpler case
        [
          // Text content if present
          ...(inputValue.length > 0 ? [{ text: inputValue }] : []),

          // Attachments if present
          ...(composerUploadedAttachments.length > 0
            ? composerUploadedAttachments.length === 1
              ? [{ ...composerUploadedAttachments[0] }]
              : [{ attachments: composerUploadedAttachments }]
            : []),
        ]

    logJson("messageContents", messageContents)

    if (xmtpConversationId) {
      const { sentMessageIds, sentMessages } = await sendMessageMutation.mutateAsync({
        contents: messageContents,
        xmtpConversationId,
      })

      return {
        sentMessageIds,
        sentMessages,
        errorSendingMessage: undefined,
      }
    } else {
      const {
        conversation: createdConversation,
        errorSendingMessage,
        sentMessageIds,
        sentMessages,
      } = await createConversationAndSendFirstMessageMutation.mutateAsync({
        inboxIds: searchSelectedUserInboxIds,
        contents: messageContents,
      })

      return {
        createdConversation,
        sentMessageIds,
        sentMessages,
        errorSendingMessage,
      }
    }
  }, [
    composerStore,
    conversationStore,
    createConversationAndSendFirstMessageMutation,
    sendMessageMutation,
  ])

  return { send }
}
