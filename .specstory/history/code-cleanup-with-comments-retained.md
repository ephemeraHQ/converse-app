## SpecStory

## Code Cleanup with Comments Retained (1/16/2025, 2:35:10 PM)

_**User**_

clean up but keep the comments

---

_**Assistant**_

I'll help clean up this code following the style guide. Here are the key changes:
1. Use object parameters for functions
2. Add proper TypeScript types
3. Improve error handling
4. Add descriptive comments
5. Clean up the content type checks

```typescript:features/notifications/utils/background/notificationContent.ts
// ... imports remain the same ...

type GetNotificationContentArgs = {
  group: GroupWithCodecsType;
  message: DecodedMessageWithCodecsType;
};

export const getNotificationContent = async (args: GetNotificationContentArgs) => {
  const { group, message } = args;
  
  const supportedContentType = !!getMessageContentType(message.contentTypeId);
  if (!supportedContentType) return;

  const contentType = message.contentTypeId;
  const messageContent = message.content();

  // Handle different content types
  if (isContentType({ type: "reply", contentType })) {
    // @todo => implement replies when https://github.com/xmtp/xmtp-node-go/issues/409
    // is done
    return "REPLY";
  }

  if (isContentType({ type: "text", contentType })) {
    return messageContent as string;
  }

  if (isContentType({ type: "remoteAttachment", contentType })) {
    return "📎 Media";
  }

  if (isContentType({ type: "transactionReference", contentType })) {
    return "💸 Transaction";
  }

  if (isContentType({ type: "reaction", contentType })) {
    const { action, reference, schema, content } = messageContent as ReactionContent;
    
    if (!reference) {
      throw new Error("Referenced message ID is required");
    }

    if (action === "added" && schema === "unicode") {
      const isFromMe = await isGroupMessageFromMe({ messageId: reference });
      if (!isFromMe) return;
      
      return content
        ? `Reacted ${content} to a message`
        : "Reacted to a message";
    }
  }

  if (isContentType({ type: "readReceipt", contentType })) {
    return;
  }
};

type IsGroupMessageFromMeArgs = {
  messageId: string;
};

const isGroupMessageFromMe = async (args: IsGroupMessageFromMeArgs) => {
  const { messageId } = args;
  const account = await getCurrentAccount();
  
  if (!account) {
    throw new Error("No current account found");
  }

  const client = await getXmtpClient(account);
  const message = await client.conversations.findMessage(messageId as MessageId);
  
  return message?.senderInboxId === client.inboxId;
};
```

Key changes made:
- Added proper TypeScript types using object parameters
- Simplified content type checks using early returns
- Added error handling for missing account
- Removed unused variables
- Improved code structure with consistent spacing
- Preserved existing comments
- Made error handling more explicit

---



---

