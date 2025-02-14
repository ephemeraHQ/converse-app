## SpecStory

## Extracting Unread Check Function from Hook (1/17/2025, 10:17:06 AM)

_**User**_

I want a function outsite of the hook that I can call like conversationIsUnread

---

_**Assistant**_

I'll help you extract the unread check logic into a separate pure function that can be used independently of the hook. Here's how we can modify the file:

```typescript:features/conversation-list/hooks/use-conversation-is-unread.ts
// ... existing code ...

type ConversationIsUnreadArgs = {
  lastMessage: { senderInboxId: string; sentNs: number } | undefined;
  conversationMetadata: { markedAsUnread?: boolean; readUntil?: number } | undefined;
  currentUserInboxId: string | undefined;
  isLoadingMetadata?: boolean;
};

export function conversationIsUnread(args: ConversationIsUnreadArgs) {
  const { lastMessage, conversationMetadata, currentUserInboxId, isLoadingMetadata } = args;

  // By default we consider the conversation read if we haven't loaded the conversation metadata
  if (isLoadingMetadata) {
    return false;
  }

  // User intentionally marked as unread
  if (conversationMetadata?.markedAsUnread) {
    return true;
  }

  // If the last message is from the current user, it's not unread... unless they marked the convo as unread but it's handled above
  if (lastMessage?.senderInboxId === currentUserInboxId) {
    return false;
  }

  if (!lastMessage) {
    return false;
  }

  return conversationIsUnreadByTimestamp({
    lastMessageSent: lastMessage.sentNs,
    readUntil: conversationMetadata?.readUntil ?? 0,
  });
}

export const useConversationIsUnread = ({
  topic,
}: UseConversationIsUnreadArgs) => {
  // ... existing code ...

  const isUnread = useMemo(() => {
    return conversationIsUnread({
      lastMessage,
      conversationMetadata,
      currentUserInboxId,
      isLoadingMetadata: isLoadingConversationMetadata,
    });
  }, [
    lastMessage,
    conversationMetadata,
    isLoadingConversationMetadata,
    currentUserInboxId,
  ]);

  // ... existing code ...
};
```

I've extracted the unread check logic into a pure function called `conversationIsUnread` that takes an object with all the necessary parameters. The hook now uses this function inside its `useMemo`. This allows the unread check logic to be used independently of the hook while maintaining the same behavior.

The function takes typed arguments and follows the style guide by using object parameters and proper TypeScript types. The logic remains exactly the same, just moved to a separate function that can be imported and used elsewhere.

---

_**User**_

remove the isoadingMetadata in arg and remove "conversationMetadata" 

---

_**Assistant**_

I'll simplify the function by removing those parameters and only focusing on the core unread logic.

```typescript:features/conversation-list/hooks/use-conversation-is-unread.ts
// ... existing code ...

type ConversationIsUnreadArgs = {
  lastMessage: { senderInboxId: string; sentNs: number } | undefined;
  currentUserInboxId: string | undefined;
  readUntil?: number;
  markedAsUnread?: boolean;
};

export function conversationIsUnread(args: ConversationIsUnreadArgs) {
  const { lastMessage, currentUserInboxId, readUntil = 0, markedAsUnread } = args;

  // User intentionally marked as unread
  if (markedAsUnread) {
    return true;
  }

  // If the last message is from the current user, it's not unread
  if (lastMessage?.senderInboxId === currentUserInboxId) {
    return false;
  }

  if (!lastMessage) {
    return false;
  }

  return conversationIsUnreadByTimestamp({
    lastMessageSent: lastMessage.sentNs,
    readUntil,
  });
}

export const useConversationIsUnread = ({
  topic,
}: UseConversationIsUnreadArgs) => {
  // ... existing code ...

  const isUnread = useMemo(() => {
    if (isLoadingConversationMetadata) {
      return false;
    }

    return conversationIsUnread({
      lastMessage,
      currentUserInboxId,
      readUntil: conversationMetadata?.readUntil,
      markedAsUnread: conversationMetadata?.markedAsUnread,
    });
  }, [
    lastMessage,
    conversationMetadata,
    isLoadingConversationMetadata,
    currentUserInboxId,
  ]);

  // ... existing code ...
};
```

I've simplified the function by:
1. Removing the `isLoadingMetadata` parameter since that's hook-specific logic
2. Flattening the `conversationMetadata` object into individual parameters (`readUntil` and `markedAsUnread`)
3. Setting a default value of 0 for `readUntil`

The hook now handles the loading state separately before calling the pure function.

---

_**User**_

For the code present, we get this error:
```
Type 'string' does not satisfy the constraint 'never'.
  Type 'string' is not assignable to type 'never'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error is likely due to the type constraint. Let's fix the type definition:

```typescript:features/conversation-list/hooks/use-conversation-is-unread.ts
type ConversationIsUnreadArgs = {
  lastMessage: { senderInboxId: string | null; sentNs: number } | undefined;
  currentUserInboxId: string | null | undefined;
  readUntil?: number | null;
  markedAsUnread?: boolean | null;
};
```

I've added `null` as a possible type to match the types from `IConversationMetadataQueryData`. This should resolve the type constraint error.

---



---

