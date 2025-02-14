## SpecStory

## Improving TypeScript Message Structure (12/12/2024, 2:59:45 PM)

_**User**_

I want to fix this, like content can be many things but each differ,et i can send a text and an attachment, a text only, an attachment only

---

_**Assistant**_

I'll help you restructure the `ISendMessageParams` type to make it clearer and more type-safe. Here's how we can improve it:

```typescript:features/conversation/hooks/use-send-message.ts
// ... existing imports ...

type IMessageContent = 
  | { type: 'text'; text: string }
  | { type: 'attachment'; attachment: RemoteAttachmentContent }
  | { type: 'textWithAttachment'; text: string; attachment: RemoteAttachmentContent };

export type ISendMessageParams = {
  referencedMessageId?: MessageId;
  content: IMessageContent;
};
```

This change will require updating the `sendMessage` function to handle the new type structure:

```typescript:features/conversation/hooks/use-send-message.ts
export function sendMessage(args: {
  conversation: ConversationWithCodecsType;
  params: ISendMessageParams;
}) {
  const { conversation, params } = args;
  const { referencedMessageId, content } = params;

  const getMessage = () => {
    switch (content.type) {
      case 'text':
        return { text: content.text };
      case 'attachment':
        return { remoteAttachment: content.attachment };
      case 'textWithAttachment':
        return { 
          text: content.text,
          remoteAttachment: content.attachment 
        };
    }
  };

  if (referencedMessageId) {
    return conversation.send({
      reply: {
        reference: referencedMessageId,
        content: getMessage(),
      },
    });
  }

  return conversation.send(getMessage());
}
```

This new structure provides several benefits:
1. Clear distinction between different message types using discriminated unions
2. Type safety - you can't accidentally send an undefined text
3. Explicit support for all three cases: text-only, attachment-only, or both
4. Better TypeScript autocompletion when using the type

When using this updated version, you would call it like this:
```typescript
// Text only
sendMessage({
  content: { type: 'text', text: 'Hello!' }
});

// Attachment only
sendMessage({
  content: { type: 'attachment', attachment: someAttachment }
});

// Both text and attachment
sendMessage({
  content: { 
    type: 'textWithAttachment', 
    text: 'Check this out!', 
    attachment: someAttachment 
  }
});
```

---



---

