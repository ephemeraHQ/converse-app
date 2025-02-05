import { useCreateConversationAndSendFirstMessage } from "@/features/conversation/conversation-create/use-create-conversation-and-send-first-message";
import { useConversationStore } from "@/features/conversation/conversation.store-context";
import {
  ISendMessageParams,
  useSendMessage,
} from "@/features/conversation/hooks/use-send-message";
import { saveAttachmentLocally } from "@/utils/attachment/attachment.utils";
import { captureErrorWithToast } from "@/utils/capture-error";
import { sentryTrackError } from "@utils/sentry";
import { useCallback } from "react";
import { useConversationComposerStore } from "./conversation-composer.store-context";

export function useSend() {
  const composerStore = useConversationComposerStore();
  const conversationStore = useConversationStore();
  const { handleMediaPreview } = useMediaPreview();

  const { sendMessage } = useSendMessage();
  const { mutateAsync: createConversationAndSendFirstMessage } =
    useCreateConversationAndSendFirstMessage();

  // Handle sending to existing conversation
  const sendToExistingConversation = useCallback(
    async (params: ISendMessageParams) => {
      try {
        const { isCreatingNewConversation } = conversationStore.getState();

        if (isCreatingNewConversation) {
          conversationStore.setState({ isCreatingNewConversation: false });
        }

        await sendMessage(params);
      } catch (error) {
        captureErrorWithToast(error, { message: "Failed to send message" });
      }
    },
    [conversationStore, sendMessage]
  );

  const createNewConversation = useCallback(
    async (params: Omit<ISendMessageParams, "topic">) => {
      try {
        const inboxIds =
          conversationStore.getState().searchSelectedUserInboxIds;

        if (!inboxIds) {
          throw new Error("No inbox ids selected");
        }

        const { conversation } = await createConversationAndSendFirstMessage({
          inboxIds,
          content: {
            // For now we only support text messages
            text: params.content.text!,
          },
        });

        conversationStore.setState({
          topic: conversation.topic,
          isCreatingNewConversation: false,
        });
      } catch (error) {
        captureErrorWithToast(error, {
          message: "Failed to create conversation",
        });
      }
    },
    [conversationStore, createConversationAndSendFirstMessage]
  );

  const send = useCallback(async () => {
    const { topic } = conversationStore.getState();
    const { inputValue, replyingToMessageId } = composerStore.getState();

    const uploadedAttachment = await handleMediaPreview();

    const messageParamsWithTopic: Omit<ISendMessageParams, "topic"> = {
      content: uploadedAttachment
        ? { remoteAttachment: uploadedAttachment }
        : { text: inputValue },
      ...(replyingToMessageId && {
        referencedMessageId: replyingToMessageId,
      }),
    };

    if (uploadedAttachment || inputValue.length > 0) {
      if (topic) {
        await sendToExistingConversation({
          ...messageParamsWithTopic,
          topic,
        });
      } else {
        await createNewConversation(messageParamsWithTopic);
      }
    }

    // Reset the composer
    composerStore.getState().reset();
  }, [
    composerStore,
    conversationStore,
    createNewConversation,
    sendToExistingConversation,
    handleMediaPreview,
  ]);

  return { send };
}

function useMediaPreview() {
  const composerStore = useConversationComposerStore();

  async function waitUntilMediaPreviewIsUploaded() {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkStatus = () => {
        const mediaPreview = composerStore.getState().composerMediaPreview;

        if (!mediaPreview?.status) {
          resolve(true);
          return;
        }
        if (mediaPreview.status === "uploaded") {
          resolve(true);
          return;
        }
        if (Date.now() - startTime > 10000) {
          reject(new Error("Media upload timeout after 10 seconds"));
          return;
        }
        setTimeout(checkStatus, 200);
      };
      checkStatus();
    });
  }

  async function handleMediaPreview() {
    const mediaPreview = composerStore.getState().composerMediaPreview;
    if (!mediaPreview) return null;

    if (mediaPreview.status === "uploading") {
      await waitUntilMediaPreviewIsUploaded();
    }

    composerStore.getState().updateMediaPreviewStatus("sending");

    try {
      if (mediaPreview) {
        await saveAttachmentLocally(mediaPreview);
      }
    } catch (error) {
      sentryTrackError(error);
    }

    const uploadedAttachment =
      composerStore.getState().composerUploadedAttachment;
    if (!uploadedAttachment) {
      throw new Error("Something went wrong while uploading attachment");
    }

    // Clean up
    composerStore.getState().setComposerMediaPreview(null);
    composerStore.getState().setComposerUploadedAttachment(null);

    return uploadedAttachment;
  }

  return { handleMediaPreview };
}
