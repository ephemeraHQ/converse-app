## SpecStory

## Message Content Validation Implementation (2/8/2025, 7:07:19 PM)

_**User**_

i want that if. we don't have remoteattachemnt ADN context.text then throw error invalid content

---

_**Assistant**_

I'll help you add validation to ensure either text or remoteAttachment is provided. Here's how we can modify the `sendMessage` function:

```typescript:features/conversation/hooks/use-send-message.ts
// ... existing imports ...

export async function sendMessage(args: ISendMessageParams) {
  const { referencedMessageId, content, topic } = args;

  // Add validation to ensure either text or remoteAttachment is provided
  if (!content.remoteAttachment && !content.text) {
    throw new Error("Invalid content: Either text or remoteAttachment must be provided");
  }

  const conversation = await getOrFetchConversation({
    topic,
    account: getCurrentAccount()!,
    caller: "use-send-message#sendMessage",
  });

  // ... rest of the existing code ...
}

// ... rest of the file remains unchanged ...
```

This change adds a validation check at the beginning of the `sendMessage` function that throws an error if neither `content.text` nor `content.remoteAttachment` is provided. This ensures that we always have valid content to send in the message.

---



---

