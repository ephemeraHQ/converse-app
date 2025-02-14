## SpecStory

## Improving TypeScript Type Definitions (12/12/2024, 3:00:54 PM)

_**User**_

make better

---

_**Assistant**_

I'll help improve the type definition to make it clearer and more maintainable. Here's a better way to structure the types:

```typescript:features/conversation/hooks/use-send-message.ts
type IMessageContent = {
  text?: string;
  remoteAttachment?: RemoteAttachmentContent;
};

export type ISendMessageParams = {
  referencedMessageId?: MessageId;
  content: IMessageContent;
};
```

This improvement:
1. Separates the content type into its own interface for better reusability
2. Simplifies the union types into a single object with optional properties
3. Makes the type more readable and easier to maintain
4. Still maintains the same type safety as the original
5. Follows the naming convention of prefixing types with 'I'

The new type structure will work the same way as before, allowing:
- Text-only messages: `{ content: { text: "hello" } }`
- Attachment-only messages: `{ content: { remoteAttachment: attachment } }`
- Messages with both: `{ content: { text: "hello", remoteAttachment: attachment } }`
- Referenced messages with any of the above content types

---



---

