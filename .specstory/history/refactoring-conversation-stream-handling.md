## SpecStory

## Refactoring Conversation Stream Handling (1/28/2025, 12:08:25 PM)

_**User**_

 i feel having the onNewConversation here in the queryFn isn't ideal

---

_**Assistant**_

You're right. Having the `onNewConversation` callback inside the queryFn isn't ideal because:

1. It mixes concerns - the query function should focus on data fetching, not handling side effects
2. It makes the streaming logic less reusable and harder to test
3. The callback logic is tightly coupled with the query

Let's refactor this to separate these concerns. We can create a custom hook that handles the streaming subscription and conversation handling:

```typescript:queries/conversations-streaming-query.ts
import { streamConversations } from "@/utils/xmtpRN/xmtp-conversations/xmtp-conversations-stream";
import { queryOptions } from "@tanstack/react-query";

// Simplified query that just handles the streaming connection
export function getConversationsStreamingQueryOptions(args: {
  ethAddress: string;
}) {
  const { ethAddress } = args;
  return queryOptions({
    queryKey: ["conversations-streaming", ethAddress],
    queryFn: async () => {
      await streamConversations({ ethAddress });
    },
  });
}
```

Then create a new hook to handle the conversation management:

```typescript:features/conversation/hooks/use-conversation-stream-handler.ts
import { isConversationAllowed } from "@/features/conversation/utils/is-conversation-allowed";
import { isConversationConsentUnknown } from "@/features/conversation/utils/is-conversation-consent-unknown";
import { addConversationToUnknownConsentConversationsQuery } from "@/queries/unknown-consent-conversations-query";
import { addConversationToConversationsQuery } from "@/queries/use-conversations-query";
import { streamConversations } from "@/utils/xmtpRN/xmtp-conversations/xmtp-conversations-stream";
import { useEffect } from "react";
import { useCurrentAccount } from "@/data/store/accountsStore";

export function useConversationStreamHandler() {
  const account = useCurrentAccount();

  useEffect(() => {
    if (!account) return;

    const subscription = streamConversations({
      ethAddress: account,
      onNewConversation: (conversation) => {
        if (isConversationAllowed(conversation)) {
          addConversationToConversationsQuery({
            account,
            conversation,
          });
        } else if (isConversationConsentUnknown(conversation)) {
          addConversationToUnknownConsentConversationsQuery({
            account,
            conversation,
          });
        }
      },
    });

    return () => {
      subscription.unsubscribe?.();
    };
  }, [account]);
}
```

This separation of concerns:
1. Keeps the query function focused on maintaining the connection
2. Moves the conversation handling logic to a dedicated hook
3. Makes it easier to test and modify the conversation handling logic independently
4. Properly handles cleanup with the subscription unsubscribe
5. Uses `useCurrentAccount` following our style guide for accessing the current account

You would use these together in your component:

```typescript
function SomeComponent() {
  useConversationStreamHandler();
  const { data } = useQuery(getConversationsStreamingQueryOptions({ ethAddress }));
  // ...
}
```

---

_**User**_

possible to make the conversation query abstract like it now and using the useQuery and getQueryOptions and then defining what we do with new Conversation in each separate component

---

_**Assistant**_

Yes, absolutely! We can make the streaming query more abstract and allow components to define their own `onNewConversation` handlers. Here's how we can refactor it:

```typescript:queries/conversations-streaming-query.ts
import { streamConversations } from "@/utils/xmtpRN/xmtp-conversations/xmtp-conversations-stream";
import { queryOptions } from "@tanstack/react-query";
import { Conversation } from "@xmtp/react-native-sdk";

type ConversationsStreamingQueryOptions = {
  ethAddress: string;
  onNewConversation?: (conversation: Conversation) => void;
};

export function getConversationsStreamingQueryOptions(args: ConversationsStreamingQueryOptions) {
  const { ethAddress, onNewConversation } = args;
  
  return queryOptions({
    queryKey: ["conversations-streaming", ethAddress],
    queryFn: async () => {
      await streamConversations({ 
        ethAddress,
        onNewConversation 
      });
    },
  });
}
```

Then in your components, you can use it like this:

```typescript:features/conversation/components/allowed-conversations.ts
export function AllowedConversations() {
  const account = useCurrentAccount();
  
  const { data } = useQuery(
    getConversationsStreamingQueryOptions({
      ethAddress: account,
      onNewConversation: (conversation) => {
        if (isConversationAllowed(conversation)) {
          addConversationToConversationsQuery({
            account,
            conversation,
          });
        }
      },
    })
  );
  
  // ... rest of component
}
```

```typescript:features/conversation/components/unknown-consent-conversations.ts
export function UnknownConsentConversations() {
  const account = useCurrentAccount();
  
  const { data } = useQuery(
    getConversationsStreamingQueryOptions({
      ethAddress: account,
      onNewConversation: (conversation) => {
        if (isConversationConsentUnknown(conversation)) {
          addConversationToUnknownConsentConversationsQuery({
            account,
            conversation,
          });
        }
      },
    })
  );
  
  // ... rest of component
}
```

This approach:
1. Makes the streaming query more flexible and reusable
2. Allows each component to handle conversations according to its specific needs
3. Keeps the separation of concerns while maintaining the convenience of using React Query
4. Follows the style guide by using object parameters and proper typing

The components can now decide what to do with new conversations while still benefiting from React Query's caching and state management.

---

_**User**_

maybe streaming like this shouldn't be in react-query? What do you think?

---

_**Assistant**_

You raise a good point. Using React Query for streaming might not be the best approach because:

1. React Query is primarily designed for request-response patterns, not continuous streaming
2. The streaming connection doesn't really benefit from React Query's caching mechanisms
3. The `queryFn` is expected to return data, but our streaming connection is more about maintaining a connection and handling events
4. Using React Query for this creates an unnecessary abstraction layer

Instead, we could create a custom hook that directly manages the streaming connection:

```typescript:hooks/use-conversations-stream.ts
import { streamConversations } from "@/utils/xmtpRN/xmtp-conversations/xmtp-conversations-stream";
import { useEffect, useState } from "react";
import { Conversation } from "@xmtp/react-native-sdk";

type UseConversationsStreamProps = {
  ethAddress: string;
  onNewConversation?: (conversation: Conversation) => void;
};

export function useConversationsStream(args: UseConversationsStreamProps) {
  const { ethAddress, onNewConversation } = args;
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setError(null);
    setIsConnected(false);

    try {
      const subscription = streamConversations({
        ethAddress,
        onNewConversation,
      });

      setIsConnected(true);

      return () => {
        subscription.unsubscribe?.();
        setIsConnected(false);
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to start streaming'));
      setIsConnected(false);
    }
  }, [ethAddress, onNewConversation]);

  return {
    isConnected,
    error,
  };
}
```

This approach:
1. Directly manages the streaming connection lifecycle
2. Provides connection status and error states
3. Properly handles cleanup
4. Is more straightforward and purpose-built for streaming
5. Makes it clearer that this is a streaming connection, not a regular query

Usage would look like:

```typescript
function SomeComponent() {
  const account = useCurrentAccount();
  
  const { isConnected, error } = useConversationsStream({
    ethAddress: account,
    onNewConversation: (conversation) => {
      // Handle new conversations
    },
  });

  if (error) {
    // Handle error state
  }

  // ... rest of component
}
```

This feels more appropriate for a streaming use case. What do you think?

---



---

