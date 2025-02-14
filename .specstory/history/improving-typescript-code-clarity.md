## SpecStory

## Improving TypeScript Code Clarity (12/9/2024, 2:30:07 PM)

_**User**_

how can i maket his cleaner, here's the params :

DmConversation:
    | {
        peerAddress: string;
      }
    | {
        topic: ConversationTopic;
      };

---

_**Assistant**_

I'll help you make this cleaner. The main issue is that we're not properly typing and handling the route params distinction. Here's how we can improve it:

```typescript:features/conversation/dm-conversation/dm-conversation.screen.tsx
type IDmConversationParams = {
  peerAddress: string;
} | {
  topic: ConversationTopic;
};

type IProps = NativeStackScreenProps<NavigationParamList, "DmConversation">;

export const DmConversationScreen = memo(function DmConversationScreen(props: IProps) {
  const { route } = props;
  const currentAccount = useCurrentAccount()!;
  
  const peerAddress = 'peerAddress' in route.params ? route.params.peerAddress : undefined;
  
  const { data: conversation, isLoading } = useConversationWithPeerQuery(
    currentAccount,
    peerAddress,
    {
      enabled: Boolean(peerAddress),
    }
  );

  const topic = 'topic' in route.params ? route.params.topic : conversation?.topic;

  if (topic) {
    return <ExistingDmConversationContent topic={topic} />;
  }

  return (
    <Screen style={{ flex: 1 }}>
      {isLoading ? (
        <Center style={{ flex: 1 }}>
          <Loader />
        </Center>
      ) : (
        <NewDmConversationContent peerAddress={peerAddress!} />
      )}
    </Screen>
  );
});
```

Key improvements made:

1. Added proper type definitions at the top for better readability
2. Destructured `route` from props
3. Used type guards to safely check for `peerAddress` and `topic`
4. Simplified the condition for `topic` since we don't need to check `conversation?.topic` separately
5. Simplified styles by removing `contentContainerStyle` and using direct `style` prop
6. Added proper type assertion for `peerAddress` in `NewDmConversationContent` since we know it exists in this context

The code is now more type-safe and easier to read with proper type guards for the discriminated union type of the route params.

---

_**User**_

cleaner, I want 2 clear different path for depending on the params

---

_**Assistant**_

Ah, I see! Let's separate the logic completely based on the route params. This will make the code paths much clearer:

```typescript:features/conversation/dm-conversation/dm-conversation.screen.tsx
type IProps = NativeStackScreenProps<NavigationParamList, "DmConversation">;

export const DmConversationScreen = memo(function DmConversationScreen(props: IProps) {
  const { route } = props;
  
  // If we have a topic, render existing conversation immediately
  if ('topic' in route.params) {
    return <ExistingDmConversationContent topic={route.params.topic} />;
  }

  // Otherwise, handle the peer address flow
  return <PeerAddressFlow peerAddress={route.params.peerAddress} />;
});

type IPeerAddressFlowProps = {
  peerAddress: string;
};

const PeerAddressFlow = memo(function PeerAddressFlow(args: IPeerAddressFlowProps) {
  const { peerAddress } = args;
  const currentAccount = useCurrentAccount()!;
  
  const { data: conversation, isLoading } = useConversationWithPeerQuery(
    currentAccount,
    peerAddress,
    { enabled: true }
  );

  if (conversation?.topic) {
    return <ExistingDmConversationContent topic={conversation.topic} />;
  }

  return (
    <Screen style={{ flex: 1 }}>
      {isLoading ? (
        <Center style={{ flex: 1 }}>
          <Loader />
        </Center>
      ) : (
        <NewDmConversationContent peerAddress={peerAddress} />
      )}
    </Screen>
  );
});
```

Key improvements:
1. Separated into two distinct flows based on the route params
2. Early return for the topic-based flow
3. Moved all peer address-related logic into its own component
4. Removed unnecessary enabled check since we know peerAddress exists
5. Cleaner type handling with no type assertions needed
6. Each flow is now more focused and easier to understand

The code now has two clear paths:
1. If we have a topic → Show existing conversation immediately
2. If we have a peer address → Check for existing conversation, then either show existing or new conversation UI

---



---

