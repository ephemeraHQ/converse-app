import { useCallback } from "react"
import { showSnackbar } from "@/components/snackbar/snackbar.service"
import { IUploadedRemoteAttachment } from "@/features/conversation/conversation-chat/conversation-attachment/conversation-attachments.types"
import { useConversationStore } from "@/features/conversation/conversation-chat/conversation.store-context"
import { useCreateConversationAndSendFirstMessageMutation } from "@/features/conversation/conversation-create/mutations/create-conversation-and-send-first-message.mutation"
import {
  ISendMessageParams,
  useSendMessage,
} from "@/features/conversation/hooks/use-send-message.mutation"
import { IXmtpMessageId } from "@/features/xmtp/xmtp.types"
import { logJson } from "@/utils/logger"
import { waitUntilPromise } from "@/utils/wait-until-promise"
import {
  IComposerMediaPreview,
  useConversationComposerStore,
} from "./conversation-composer.store-context"

// ----- Utility Functions -----

/**
 * Waits for all media previews to be uploaded
 */
function waitForMediaUploads(composerMediaPreviews: IComposerMediaPreview[]) {
  return waitUntilPromise({
    checkFn: () =>
      composerMediaPreviews.every((preview) => !preview || preview.status === "uploaded"),
  })
}

/**
 * Creates message content structure based on input values and attachments
 */
function createMessageContents(args: {
  inputValue: string
  replyingToMessageId: IXmtpMessageId | null
  composerUploadedAttachments: IUploadedRemoteAttachment[]
}) {
  const { inputValue, replyingToMessageId, composerUploadedAttachments } = args

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

  return messageContents
}

/**
 * Hook for sending a message to an existing conversation
 */
export function useSendToExistingConversation() {
  const composerStore = useConversationComposerStore()
  const conversationStore = useConversationStore()
  const sendMessageMutation = useSendMessage()

  return useCallback(async () => {
    const { inputValue, replyingToMessageId, composerUploadedAttachments, composerMediaPreviews } =
      composerStore.getState()
    const { xmtpConversationId } = conversationStore.getState()

    if (!xmtpConversationId) {
      throw new Error("Cannot send message: conversation ID is missing")
    }

    // Wait for media uploads to complete
    await waitForMediaUploads(composerMediaPreviews)

    // Create message contents
    const messageContents = createMessageContents({
      inputValue,
      replyingToMessageId,
      composerUploadedAttachments,
    })

    logJson("messageContents", messageContents)

    // Reset composer state before sending to prevent duplicate sends
    composerStore.getState().reset()

    // Send the message
    const { sentXmtpMessageIds, sentMessages } = await sendMessageMutation.mutateAsync({
      contents: messageContents,
      xmtpConversationId,
    })

    return {
      sentXmtpMessageIds,
      sentMessages,
    }
  }, [composerStore, conversationStore, sendMessageMutation])
}

/**
 * Hook for creating a new conversation and sending the first message
 */
export function useCreateConversationAndSend() {
  const composerStore = useConversationComposerStore()
  const conversationStore = useConversationStore()
  const createConversationAndSendFirstMessageMutation =
    useCreateConversationAndSendFirstMessageMutation()

  return useCallback(async () => {
    const { inputValue, replyingToMessageId, composerUploadedAttachments, composerMediaPreviews } =
      composerStore.getState()
    const { searchSelectedUserInboxIds } = conversationStore.getState()

    try {
      // Wait for media uploads to complete
      await waitForMediaUploads(composerMediaPreviews)

      // Create message contents
      const messageContents = createMessageContents({
        inputValue,
        replyingToMessageId,
        composerUploadedAttachments,
      })

      logJson("messageContents", messageContents)

      // Reset composer state before sending to prevent duplicate sends
      composerStore.getState().reset()

      // Create conversation and send message
      const {
        conversation: createdConversation,
        errorSendingMessage,
        sentXmtpMessageIds,
        sentMessages,
      } = await createConversationAndSendFirstMessageMutation.mutateAsync({
        inboxIds: searchSelectedUserInboxIds,
        contents: messageContents,
      })

      if (errorSendingMessage) {
        showSnackbar({
          message: "Failed to send message",
          type: "error",
        })
      }

      // Update conversation state to reflect the new conversation
      conversationStore.setState({
        xmtpConversationId: createdConversation?.xmtpId,
        isCreatingNewConversation: false,
      })

      return {
        createdConversation,
        sentMessageIds: sentXmtpMessageIds,
        sentMessages,
        errorSendingMessage,
      }
    } catch (error) {
      // Reset conversation state to allow for retrying
      conversationStore.setState({
        xmtpConversationId: undefined,
        isCreatingNewConversation: true,
      })

      throw error
    }
  }, [composerStore, conversationStore, createConversationAndSendFirstMessageMutation])
}
