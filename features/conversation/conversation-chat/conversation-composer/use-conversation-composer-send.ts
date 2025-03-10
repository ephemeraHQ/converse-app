import { useCallback } from "react"
import { showSnackbar } from "@/components/snackbar/snackbar.service"
import { useConversationStore } from "@/features/conversation/conversation-chat/conversation.store-context"
import { useCreateConversationAndSendFirstMessage } from "@/features/conversation/conversation-create/mutations/create-conversation-and-send-first-message.mutation"
import { ISendMessageParams, useSendMessage } from "@/features/conversation/hooks/use-send-message"
import { captureErrorWithToast } from "@/utils/capture-error"
import { FeedbackError } from "@/utils/error"
import { waitUntilPromise } from "@/utils/wait-until-promise"
import { useConversationComposerStore } from "./conversation-composer.store-context"

export function useConversationComposerSend() {
  const composerStore = useConversationComposerStore()
  const conversationStore = useConversationStore()

  const { sendMessage } = useSendMessage()
  const { mutateAsync: createConversationAndSendFirstMessage } =
    useCreateConversationAndSendFirstMessage()

  // Handle sending to existing conversation
  const sendToExistingConversation = useCallback(
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

  const createNewConversation = useCallback(
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
            // For now we only support text messages
            text: params.content.text!,
          },
        })

        conversationStore.setState({
          topic: conversation.topic,
          isCreatingNewConversation: false,
        })
      } catch (error) {
        // TODO: Maybe find a better way to handle this
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

  const send = useCallback(async () => {
    const { topic } = conversationStore.getState()
    const { composerMediaPreviews } = composerStore.getState()

    // If there are media previews, wait for them to finish uploading
    if (composerMediaPreviews.length > 0) {
      try {
        await waitUntilPromise({
          checkFn: () =>
            composerMediaPreviews.every((preview) => !preview || preview.status === "uploaded"),
        })

        // Mark all as sending
        composerMediaPreviews.forEach((preview) => {
          if (preview) {
            composerStore.getState().updateMediaPreviewStatus(preview.mediaURI, "sending")
          }
        })
      } catch (error) {
        captureErrorWithToast(error, { message: "Failed to upload media" })
        return
      }
    }

    const { inputValue, replyingToMessageId, composerUploadedAttachments } =
      composerStore.getState()

    // Reset the composer before sending just for better UX
    composerStore.getState().reset()

    if (composerUploadedAttachments.length > 0 || inputValue.length > 0) {
      if (topic) {
        // First send the text message if there is any text
        if (inputValue.length > 0) {
          await sendToExistingConversation({
            topic,
            content: { text: inputValue },
            ...(replyingToMessageId && {
              referencedMessageId: replyingToMessageId,
            }),
          })
        }

        // Send all attachments in a single message
        if (composerUploadedAttachments.length > 0) {
          await sendToExistingConversation({
            topic,
            content: { remoteAttachments: composerUploadedAttachments },
            ...(replyingToMessageId && {
              referencedMessageId: replyingToMessageId,
            }),
          })
        }
      } else {
        // First send the text message if there is any text
        if (inputValue.length > 0) {
          await createNewConversation({
            content: { text: inputValue },
            ...(replyingToMessageId && {
              referencedMessageId: replyingToMessageId,
            }),
          })
        }

        // Send all attachments in a single message
        await createNewConversation({
          content: { remoteAttachments: composerUploadedAttachments },
          ...(replyingToMessageId && {
            referencedMessageId: replyingToMessageId,
          }),
        })
      }
    }
  }, [composerStore, conversationStore, createNewConversation, sendToExistingConversation])

  return { send }
}
