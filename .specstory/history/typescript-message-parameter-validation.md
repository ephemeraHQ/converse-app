## SpecStory

## TypeScript Message Parameter Validation (12/12/2024, 3:02:29 PM)

_**User**_

but the problem here is i don't want to be able to send {}

---

_**Assistant**_

I understand you want to ensure that at least one of `text` or `remoteAttachment` is provided when sending a message. Here's how we can modify the type to enforce this:

```typescript:features/conversation/hooks/use-send-message.ts
// ... existing imports ...

export type ISendMessageParams = {
  referencedMessageId?: MessageId;
  content: 
    | { text: string; remoteAttachment?: never }
    | { text?: never; remoteAttachment: RemoteAttachmentContent };
};
```

This change uses a discriminated union type to ensure that either:
1. `text` is provided (and `remoteAttachment` is not allowed), or
2. `remoteAttachment` is provided (and `text` is not allowed)

This prevents the possibility of sending an empty object `{}` or having both properties undefined. TypeScript will enforce that at least one of these properties must be provided.

The rest of your code should continue to work as is, but now with better type safety. The existing checks in your `sendMessage` function already handle both cases correctly.

---

_**User**_

No because i can send both at same time it's okay

---

_**Assistant**_

Ah, I understand - you want to allow both properties but ensure at least one of them is present. Here's the corrected type:

```typescript:features/conversation/hooks/use-send-message.ts
export type ISendMessageParams = {
  referencedMessageId?: MessageId;
  content: 
    | { text: string; remoteAttachment?: RemoteAttachmentContent }
    | { text?: string; remoteAttachment: RemoteAttachmentContent };
};
```

This type ensures that:
- You can send just text
- You can send just remoteAttachment
- You can send both
- But you can't send neither (empty object `{}`)

The union type now requires at least one of the properties to be defined while keeping both optional in each case, preventing the empty object scenario while maintaining the flexibility to send both if needed.

---



---

