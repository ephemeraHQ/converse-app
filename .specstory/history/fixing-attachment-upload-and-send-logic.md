## SpecStory

## Fixing Attachment Upload and Send Logic (2/7/2025, 4:13:32 PM)

_**User**_

fix this!! If you look in @conversation-composer.store-context.tsx  and @conversation-composer-send-attachment-preview.tsx @conversation-composer-add-attachment-button.tsx you'll see that when we add an attachment it gets uploaded and then we can use "composerUploadedAttachment" in @conversation-composer-use-send.ts to actually send the attachemnt 

---

_**Assistant**_

Looking at the code, I notice that there's an issue in the `handleMediaPreview` function within `conversation-composer-use-send.ts`. The function is throwing an error when there's no media preview, which is incorrect since we want to handle both text and media messages. Let me fix this:

```typescript:features/conversation/conversation-composer/conversation-composer-use-send.ts
// ... existing code ...

async function handleMediaPreview() {
  composerStore.getState().setComposerUploadedAttachment(null);
  const mediaPreview = composerStore.getState().composerMediaPreview;

  // If there's no media preview, just return null instead of throwing an error
  if (!mediaPreview) {
    return null;
  }

  if (mediaPreview.status === "uploading") {
    await waitUntilMediaPreviewIsUploaded();
  }

  composerStore.getState().updateMediaPreviewStatus("sending");

  try {
    await saveAttachmentLocally(mediaPreview);
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

// ... rest of the code ...
```

The main changes are:

1. Removed the unnecessary console.log statements for cleaner code
2. Changed the behavior when there's no media preview to return null instead of throwing an error
3. The rest of the function remains the same, handling the media upload process when there is a media preview

This fix allows the send function to work properly for both text messages and media attachments. When there's no media preview, it will return null and the send function will use the text input value instead.

The error was causing the send function to fail when trying to send text-only messages since it would throw an error when no media was present. Now it properly handles both cases.

---

_**User**_

NO!! You shouldn't touch the mediaPreview!! 

---

_**Assistant**_

I apologize for the confusion. You're right - I misunderstood the issue. Looking at the code again, the problem is in the `send` function where we're not properly handling the case when there's no attachment.

Here's the correct fix:

```typescript:features/conversation/conversation-composer/conversation-composer-use-send.ts
  const send = useCallback(async () => {
    const { topic } = conversationStore.getState();
    const { inputValue, replyingToMessageId } = composerStore.getState();

    // Reset the composer
    composerStore.getState().reset();

    let uploadedAttachment = null;
    // Only try to handle media preview if we have a media preview in the store
    if (composerStore.getState().composerMediaPreview) {
      uploadedAttachment = await handleMediaPreview();
    }

    const messageParamsWithTopic: Omit<ISendMessageParams, "topic"> = {
      content: uploadedAttachment
        ? { remoteAttachment: uploadedAttachment }
        : { text: inputValue },
      ...(replyingToMessageId && {
        referencedMessageId: replyingToMessageId,
      }),
    };

    // Only send if we have either an attachment or text input
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
  }, [
    composerStore,
    conversationStore,
    createNewConversation,
    sendToExistingConversation,
    handleMediaPreview,
  ]);
```

The key changes are:

1. Only call `handleMediaPreview()` if we actually have a media preview in the store
2. Keep the existing `handleMediaPreview` function unchanged since it's working correctly for handling media uploads
3. Structure the message params based on whether we have an uploaded attachment or text input

This should fix the issue while preserving the existing media upload functionality.

---



---

