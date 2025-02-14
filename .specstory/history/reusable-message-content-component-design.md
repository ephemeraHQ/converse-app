## SpecStory

## Reusable Message Content Component Design (12/19/2024, 10:22:04 AM)

_**User**_

I think i need another component that will accept Content and render the correct thing based on content. It can be remoteAttachmentContent, ReplyContent, String, etc...

---

_**Assistant**_

I'll help you create a new component called `MessageContent` that will handle different types of content rendering. Here's how we can refactor this:

```typescript:features/conversation/conversation-message/conversation-message-content/message-content.tsx
import { memo } from "react";
import { AttachmentRemoteImage } from "@/features/conversation/conversation-attachment/conversation-attachment-remote-image";
import { MessageText } from "@/features/conversation/conversation-message/conversation-message-text";
import { 
  isRemoteAttachmentMessage, 
  isTextMessage, 
  isReplyMessage 
} from "@/features/conversation/conversation-message/conversation-message.utils";
import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/client.types";
import { useAppTheme } from "@theme/useAppTheme";
import { useMessageContextStoreContext } from "@/features/conversation/conversation-message/conversation-message.store-context";

type IMessageContentProps = {
  message: DecodedMessageWithCodecsType;
  isNested?: boolean;
  imageHeight?: number;
  imageWidth?: number;
  numberOfLines?: number;
}

export const MessageContent = memo(function MessageContent(args: IMessageContentProps) {
  const { message, isNested, imageHeight, imageWidth, numberOfLines = 1 } = args;
  
  const { theme } = useAppTheme();
  const fromMe = useMessageContextStoreContext((s) => s.fromMe);

  if (isRemoteAttachmentMessage(message)) {
    const content = message.content();
    return (
      <AttachmentRemoteImage
        messageId={message.id}
        remoteMessageContent={content}
        containerProps={{
          style: {
            height: imageHeight ?? theme.avatarSize.md,
            width: imageWidth ?? theme.avatarSize.md,
            marginBottom: theme.spacing.xxxs,
            borderRadius: theme.borderRadius.message.attachment - theme.spacing.message.replyMessage.horizontalPadding,
          },
        }}
      />
    );
  }

  if (isTextMessage(message)) {
    const content = message.content();
    return (
      <MessageText numberOfLines={numberOfLines} inverted={fromMe}>
        {content}
      </MessageText>
    );
  }

  if (isReplyMessage(message)) {
    if (!isNested) {
      return (
        <MessageContent
          message={message}
          isNested={true}
          imageHeight={imageHeight}
          imageWidth={imageWidth}
          numberOfLines={numberOfLines}
        />
      );
    }
    return null;
  }

  return null;
});
```

Then update the `MessageReplyReferenceContent` to use this new component:

```typescript:features/conversation/conversation-message/conversation-message-content-types/conversation-message-reply.tsx
// ... existing imports ...
import { MessageContent } from "@/features/conversation/conversation-message/conversation-message-content/message-content";

const MessageReplyReferenceContent = memo(function MessageReplyReferenceContent(props: {
  replyMessage: DecodedMessageWithCodecsType;
  isNested?: boolean;
}) {
  const { replyMessage, isNested } = props;
  
  return (
    <MessageContent 
      message={replyMessage}
      isNested={isNested}
      numberOfLines={1}
    />
  );
});
```

Key changes made:
1. Created a new reusable `MessageContent` component that handles all content types
2. Made the styling configurable through props
3. Simplified the `MessageReplyReferenceContent` by using the new component
4. Kept the same logic for handling different message types but made it more modular
5. Added proper TypeScript types with an `IMessageContentProps` interface

This new component can be reused anywhere you need to render message content, making the code more DRY and easier to maintain.

---



---

