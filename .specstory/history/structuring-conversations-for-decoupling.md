## SpecStory

## Structuring Conversations for Decoupling (12/9/2024, 10:39:36 AM)

_**User**_

How can i structure all this correclty.? I want max decoupling between non existing converastion, DM conversation and group conversation

---

_**Assistant**_

I'll help you restructure this code to better separate the concerns between different conversation types. Here's how we can break it down:

1. First, let's create separate files for each conversation type
2. Create a shared components folder for common elements
3. Use a factory pattern to determine which conversation type to render

Here's the proposed structure:

```typescript:components/Conversation/types.ts
export type IConversationProps = {
  topic: ConversationTopic | undefined;
  peerAddress?: string;
  textPrefill?: string;
};
```

```typescript:components/Conversation/conversation-types/dm-conversation.tsx
export const DmConversation = memo(function DmConversation() {
  const currentAccount = useCurrentAccount()!;
  const topic = useConversationCurrentTopic()!;
  const { isAllowedConversation, conversationNotFound, conversationId } = useConversationContext();
  
  const {
    data: messages,
    isLoading: messagesLoading,
    isRefetching: isRefetchingMessages,
    refetch: refetchMessages,
  } = useConversationMessages(currentAccount, topic);

  const { data: peerInboxId } = useDmPeerInboxId(currentAccount, topic);

  useDmHeader();

  if (conversationNotFound) {
    return null; // TODO: Add DM placeholder
  }

  if (messages?.ids.length === 0 && !messagesLoading) {
    return null; // TODO: Add DM placeholder
  }

  return (
    <MessagesList
      messageIds={messages?.ids ?? []}
      refreshing={isRefetchingMessages}
      onRefresh={refetchMessages}
      ListHeaderComponent={
        <DmConsentHeader 
          isAllowedConversation={isAllowedConversation}
          peerInboxId={peerInboxId}
          topic={topic}
          conversationId={conversationId}
        />
      }
    />
  );
});
```

```typescript:components/Conversation/conversation-types/group-conversation.tsx
export const GroupConversation = memo(function GroupConversation() {
  const currentAccount = useCurrentAccount()!;
  const topic = useConversationCurrentTopic()!;
  const { isAllowedConversation, conversationNotFound } = useConversationContext();
  
  const {
    data: messages,
    isLoading: messagesLoading,
    isRefetching: isRefetchingMessages,
    refetch,
  } = useConversationMessages(currentAccount, topic);

  useGroupHeader();

  if (conversationNotFound) {
    return <GroupConversationMissing />;
  }

  if (messages?.ids.length === 0 && !messagesLoading) {
    return <GroupConversationEmpty />;
  }

  return (
    <MessagesList
      messageIds={messages?.ids ?? []}
      refreshing={isRefetchingMessages}
      onRefresh={refetch}
      ListHeaderComponent={
        <GroupConsentHeader 
          isAllowedConversation={isAllowedConversation}
          topic={topic}
        />
      }
    />
  );
});
```

```typescript:components/Conversation/V3Conversation.tsx
export const V3Conversation = memo(function V3Conversation({
  topic,
  peerAddress,
  textPrefill,
}: IConversationProps) {
  const messageToPrefill = textPrefill ?? "";

  initializeCurrentConversation({
    topic,
    peerAddress,
    inputValue: messageToPrefill,
  });

  return (
    <ConversationStoreProvider topic={topic!}>
      <ConversationContextProvider>
        <Screen contentContainerStyle={{ flex: 1 }}>
          <ConversationContent />
        </Screen>
      </ConversationContextProvider>
    </ConversationStoreProvider>
  );
});

const ConversationContent = memo(function ConversationContent() {
  const { theme } = useAppTheme();
  const isNewConversation = useConversationContext("isNewConversation");
  const conversationVersion = useConversationContext("conversationVersion");

  return (
    <ExternalWalletPickerContextProvider>
      <AnimatedVStack
        layout={theme.animation.reanimatedSpringLayoutTransition}
        style={{ flex: 1 }}
      >
        {isNewConversation ? (
          <NewConversation />
        ) : conversationVersion === ConversationVersion.DM ? (
          <DmConversation />
        ) : (
          <ConversationGroupContextProvider>
            <GroupConversation />
          </ConversationGroupContextProvider>
        )}
        <ConversationFooter />
      </AnimatedVStack>
    </ExternalWalletPickerContextProvider>
  );
});

const ConversationFooter = memo(function ConversationFooter() {
  return (
    <>
      <ComposerWrapper />
      <KeyboardFiller />
      <MessageContextMenu />
      <MessageReactionsDrawer />
      <ExternalWalletPicker title="Choose a wallet" />
    </>
  );
});
```

Key improvements in this restructure:

1. Each conversation type (DM, Group, New) is in its own file with its own concerns
2. Shared components like MessagesList, KeyboardFiller moved to shared components folder
3. Main V3Conversation component is now simpler and acts as a router/container
4. Better separation of concerns between conversation layout and conversation content
5. Easier to maintain and extend each conversation type independently
6. Clearer component hierarchy and responsibility

Would you like me to continue with the shared components structure or would you like to focus on a specific part of this restructure?

---



---

