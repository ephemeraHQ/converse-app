import { useCallback } from "react"
import { showSnackbar } from "@/components/snackbar/snackbar.service"
import { useConversationStore } from "@/features/conversation/conversation-chat/conversation.store-context"
import { useCreateConversationAndSendFirstMessage } from "@/features/conversation/conversation-create/mutations/create-conversation-and-send-first-message.mutation"
import {
  ISendMessageContent,
  ISendMessageParams,
  useSendMessage,
} from "@/features/conversation/hooks/use-send-message"
import { captureErrorWithToast } from "@/utils/capture-error"
import { FeedbackError } from "@/utils/error"
import { waitUntilPromise } from "@/utils/wait-until-promise"
import { useConversationComposerStore } from "./conversation-composer.store-context"

// Handles sending messages to existing conversations
function useSendToExistingConversation() {
  const conversationStore = useConversationStore()
  const { sendMessage } = useSendMessage()

  return useCallback(
    async (params: ISendMessageParams) => {
      try {
        const { isCreatingNewConversation } = conversationStore.getState()

        if (isCreatingNewConversation) {
          conversationStore.setState({ isCreatingNewConversation: false })
        }

        await sendMessage(params)
      } catch (error) {
        captureErrorWithToast(error, { message: "Failed to send message" })
      }
    },
    [conversationStore, sendMessage],
  )
}

// Handles creating new conversations and sending first message
function useCreateNewConversation() {
  const conversationStore = useConversationStore()
  const { mutateAsync: createConversationAndSendFirstMessage } =
    useCreateConversationAndSendFirstMessage()

  return useCallback(
    async (params: Omit<ISendMessageParams, "topic">) => {
      try {
        const inboxIds = conversationStore.getState().searchSelectedUserInboxIds

        if (inboxIds.length === 0) {
          throw new FeedbackError({
            error: new Error("No users selected"),
          })
        }

        const { conversation } = await createConversationAndSendFirstMessage({
          inboxIds,
          content: {
            text: params.content.text!,
          },
        })

        conversationStore.setState({
          topic: conversation.topic,
          isCreatingNewConversation: false,
        })
      } catch (error) {
        if (error instanceof FeedbackError) {
          showSnackbar({
            message: error.message,
            type: "error",
          })
          return
        }

        captureErrorWithToast(error, {
          message: "Failed to create conversation",
        })
      }
    },
    [conversationStore, createConversationAndSendFirstMessage],
  )
}

// Handles media upload state management
async function waitForMediaUploads(composerStore: ReturnType<typeof useConversationComposerStore>) {
  const { composerMediaPreviews } = composerStore.getState()

  if (composerMediaPreviews.length === 0) {
    return
  }

  try {
    await waitUntilPromise({
      checkFn: () =>
        composerMediaPreviews.every((preview) => !preview || preview.status === "uploaded"),
    })

    composerMediaPreviews.forEach((preview) => {
      if (preview) {
        composerStore.getState().updateMediaPreviewStatus(preview.mediaURI, "sending")
      }
    })
  } catch (error) {
    throw error
  }
}

// Main hook that orchestrates the sending process
export function useConversationComposerSend() {
  const composerStore = useConversationComposerStore()
  const conversationStore = useConversationStore()
  const sendToExistingConversation = useSendToExistingConversation()
  const createNewConversation = useCreateNewConversation()

  const send = useCallback(async () => {
    try {
      await waitForMediaUploads(composerStore)
    } catch (error) {
      captureErrorWithToast(error, { message: "Failed to upload media" })
      return
    }

    const { inputValue, replyingToMessageId, composerUploadedAttachments } =
      composerStore.getState()
    const { topic } = conversationStore.getState()

    // Reset composer state before sending
    composerStore.getState().reset()

    if (composerUploadedAttachments.length === 0 && inputValue.length === 0) {
      return
    }

    const sendContent = async (content: ISendMessageContent) => {
      const messageParams = {
        content,
        ...(replyingToMessageId && {
          referencedMessageId: replyingToMessageId,
        }),
      }

      if (topic) {
        await sendToExistingConversation({
          ...messageParams,
          topic,
        })
      } else {
        await createNewConversation(messageParams)
      }
    }

    // Send text message if present
    if (inputValue.length > 0) {
      await sendContent({ text: inputValue })
    }

    // Send attachments if present
    if (composerUploadedAttachments.length > 0) {
      await sendContent({ remoteAttachments: composerUploadedAttachments })
    }
  }, [composerStore, conversationStore, createNewConversation, sendToExistingConversation])

  return { send }
}
