## SpecStory

## Enhancing Message Sending Functionality (12/2/2024, 11:32:45 AM)

_**User**_

make it better. I can actually send text with remoteAttachment

---

_**Assistant**_

To allow sending both text and a remote attachment together, you need to adjust the `IComposerSendArgs` type to accommodate both properties simultaneously. Here's how you can modify the type definition:

```typescript:features/conversation/composer/composer.tsx
export type IComposerSendArgs = {
  content: {
    text?: string;
    remoteAttachment?: RemoteAttachmentContent;
  };
  referencedMessageId?: MessageId;
};
```

### Explanation

- **Unified Content Object**: The `content` object now allows both `text` and `remoteAttachment` to be optional properties. This means you can send a message with either or both properties.
- **Simplified Type Definition**: Removed the union type that restricted `content` to having either `text` or `remoteAttachment` exclusively. Now, both can coexist in a single message.

This change will enable you to send messages that include both text and a remote attachment, providing more flexibility in your messaging functionality.

---

_**User**_

but what if I send empty content? It shouldn't be allowed

---

_**Assistant**_

To ensure that the `content` object is not empty, you can enforce that at least one of `text` or `remoteAttachment` must be present. You can achieve this by using a union type that requires at least one of the properties to be defined. Here's how you can modify the type definition:

```typescript:features/conversation/composer/composer.tsx
export type IComposerSendArgs = {
  content: {
    text?: string;
    remoteAttachment?: RemoteAttachmentContent;
  };
  referencedMessageId?: MessageId;
} & (
  | { content: { text: string; remoteAttachment?: RemoteAttachmentContent } }
  | { content: { text?: string; remoteAttachment: RemoteAttachmentContent } }
);
```

### Explanation

- **Union Type with Overlapping Properties**: The union type now ensures that either `text` or `remoteAttachment` must be present. This prevents the `content` object from being empty.
- **Optional Properties**: By using optional properties in each union member, you allow for flexibility in the presence of either or both properties.

This setup ensures that the `content` object will always have at least one of the required properties, preventing the sending of empty content.

---



---

