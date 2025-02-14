## SpecStory

## Improving TypeScript Typing for Conversations (12/9/2024, 11:19:11 AM)

_**User**_

I say here that conversaitonId can be null, but it cannot be really, but it will be if we're still loading the conversation. Is there a way to make it better so anyone using the context can handle the typing correclty.?

---

_**Assistant**_

I'll help improve the typing to better represent the loading state and conversation availability. Here's how we can modify the context type:

```typescript:features/conversation/conversation-context.tsx
// ... existing imports ...

export type IConversationContextType = {
  isLoadingConversationConsent: boolean;
  conversationNotFound: boolean;
} & (
  | {
      isLoadingConversationConsent: true;
      conversationId: null;
      isAllowedConversation: false;
      isBlockedConversation: false;
      sendMessage: never;
      reactOnMessage: never;
      removeReactionFromMessage: never;
    }
  | {
      isLoadingConversationConsent: false;
      conversationId: ConversationId;
      isAllowedConversation: boolean;
      isBlockedConversation: boolean;
      sendMessage: (message: ISendMessageParams) => Promise<void>;
      reactOnMessage: (args: {
        messageId: MessageId;
        emoji: string;
      }) => Promise<void>;
      removeReactionFromMessage: (args: {
        messageId: MessageId;
        emoji: string;
      }) => Promise<void>;
    }
);

// ... rest of the file ...
```

This change uses a discriminated union type to properly represent the two states:
1. When `isLoadingConversationConsent` is `true`, all other fields are either `null` or unavailable
2. When `isLoadingConversationConsent` is `false`, we have access to the conversation ID and all methods

Now consumers of the context will get proper TypeScript support - they'll need to check `isLoadingConversationConsent` before accessing other properties, and TypeScript will enforce this pattern.

For example, usage would look like:
```typescript
const isLoading = useConversationContext('isLoadingConversationConsent');
const conversationId = useConversationContext('conversationId');

if (isLoading) {
  return <LoadingSpinner />;
}

// TypeScript now knows conversationId is ConversationId (not null)
// and all other methods are available
```

---



---

