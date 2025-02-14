## SpecStory

## Code Refactoring for Improved Readability (2/5/2025, 9:22:57 AM)

_**User**_

make this much cleaner. it's so hard to read and understand what is happening

---

_**Assistant**_

I'll help restructure this code to make it cleaner and more readable. Let's break this down into smaller, more focused pieces.

1. First, let's create a new hook to handle the media preview logic:

```typescript:features/conversation/conversation-composer/hooks/use-media-preview.ts
import { useConversationComposerStore } from "../conversation-composer.store-context";
import { saveAttachmentLocally } from "@/utils/attachment/attachment.utils";
import { sentryTrackError } from "@utils/sentry";

export function useMediaPreview() {
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

    const uploadedAttachment = composerStore.getState().composerUploadedAttachment;
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
```

2. Now, let's clean up the useSend hook:

```typescript:features/conversation/conversation-composer/conversation-composer-use-send.ts
import { useCreateConversationAndSendFirstMessage } from "@/features/conversation/conversation-create/use-create-conversation-and-send-first-message";
import { useConversationStore } from "@/features/conversation/conversation.store-context";
import { ISendMessageParams, useSendMessage } from "@/features/conversation/hooks/use-send-message";
import { captureErrorWithToast } from "@/utils/capture-error";
import { useCallback } from "react";
import { useConversationComposerStore } from "./conversation-composer.store-context";
import { useMediaPreview } from "./hooks/use-media-preview";

export function useSend() {
  const composerStore = useConversationComposerStore();
  const conversationStore = useConversationStore();
  const { handleMediaPreview } = useMediaPreview();
  
  const { sendMessage } = useSendMessage();
  const { mutateAsync: createConversationAndSendFirstMessage } = useCreateConversationAndSendFirstMessage();

  // Handle sending to existing conversation
  const sendToExistingConversation = useCallback(async (params: ISendMessageParams) => {
    try {
      const { isCreatingNewConversation } = conversationStore.getState();
      
      if (isCreatingNewConversation) {
        conversationStore.setState({ isCreatingNewConversation: false });
      }

      await sendMessage(params);
    } catch (error) {
      captureErrorWithToast(error, { message: "Failed to send message" });
    }
  }, [conversationStore, sendMessage]);

  // Handle creating new conversation
  const createNewConversation = useCallback(async (content: { text: string }) => {
    try {
      const inboxIds = conversationStore.getState().searchSelectedUserInboxIds;
      if (!inboxIds) throw new Error("No inbox ids selected");

      const { conversation } = await createConversationAndSendFirstMessage({
        inboxIds,
        content,
      });

      conversationStore.setState({
        topic: conversation.topic,
        isCreatingNewConversation: false,
      });
    } catch (error) {
      captureErrorWithToast(error, { message: "Failed to create conversation" });
    }
  }, [conversationStore, createConversationAndSendFirstMessage]);

  const send = useCallback(async () => {
    const { topic } = conversationStore.getState();
    const { inputValue, replyingToMessageId } = composerStore.getState();

    // Handle media attachments
    const uploadedAttachment = await handleMediaPreview();
    if (uploadedAttachment) {
      const params = {
        topic,
        content: { remoteAttachment: uploadedAttachment },
        ...(replyingToMessageId && { referencedMessageId: replyingToMessageId }),
      };
      await sendToExistingConversation(params);
    }

    // Handle text message
    composerStore.getState().reset();
    if (inputValue.length > 0) {
      if (topic) {
        await sendToExistingConversation({
          topic,
          content: { text: inputValue },
          ...(replyingToMessageId && { referencedMessageId: replyingToMessageId }),
        });
      } else {
        await createNewConversation({ text: inputValue });
      }
    }
  }, [composerStore, conversationStore, handleMediaPreview, sendToExistingConversation, createNewConversation]);

  return { send };
}
```

Key improvements made:

1. Separated media preview logic into its own hook for better separation of concerns
2. Split the sending logic into clear, focused functions:
   - `sendToExistingConversation` for existing conversations
   - `createNewConversation` for new conversations
3. Improved variable naming and organization
4. Removed nested promise chains
5. Added clearer error handling
6. Reduced nesting levels for better readability
7. Kept related functionality together
8. Made the code flow more linear and easier to follow

The functionality remains the same, but the code is now more maintainable and easier to understand. Each function has a single responsibility, and the logic flow is more straightforward.

---



---

