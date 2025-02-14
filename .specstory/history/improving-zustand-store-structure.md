## SpecStory

## Improving Zustand Store Structure (2/4/2025, 8:22:38 AM)

_**User**_

can you help me make this cleaner. Like give me some ppattenr i could use. what i don't like right now is i a have zustand store context @conversation.store-context.tsx where the topic is stored but you can also see Content component the topic is either from store or from existing conversation. I feel this is confusing...

---

_**Assistant**_

I understand your concern. The current implementation mixes state management between the store and component-level logic, which can be confusing. Here's a suggested pattern to make it cleaner:

1. First, let's modify the store to handle the topic resolution logic:

```typescript:features/conversation/conversation.store-context.tsx
// ... existing imports ...

type IConversationStoreProps = {
  initialTopic: ConversationTopic | null;
  isCreatingNewConversation: boolean;
};

type IConversationStoreState = {
  initialTopic: ConversationTopic | null;
  searchSelectedUserInboxIds: InboxId[];
  searchTextValue: string;
  highlightedMessageId?: MessageId;
  scrollToMessageId?: MessageId;
  isCreatingNewConversation: boolean;
  // Add computed value
  resolvedTopic: ConversationTopic | null;
};

const createConversationStore = (initProps: IConversationStoreProps) => {
  const DEFAULT_PROPS: IConversationStoreState = {
    initialTopic: null,
    searchSelectedUserInboxIds: [],
    searchTextValue: "",
    highlightedMessageId: undefined,
    scrollToMessageId: undefined,
    isCreatingNewConversation: false,
    resolvedTopic: null,
  };

  return createStore<IConversationStoreState>()(
    subscribeWithSelector((set, get) => ({
      ...DEFAULT_PROPS,
      ...initProps,
      // Add computed getter for resolvedTopic
      get resolvedTopic() {
        const state = get();
        if (!state.isCreatingNewConversation) {
          return state.initialTopic;
        }
        
        const selectedUsers = state.searchSelectedUserInboxIds;
        if (selectedUsers.length === 0) return null;
        
        if (selectedUsers.length === 1) {
          const existingDm = getDmQueryData({
            ethAccountAddress: getCurrentAccount()!,
            inboxId: selectedUsers[0],
          });
          return existingDm?.topic ?? null;
        }
        
        const existingGroup = getGroupQueryData({
          memberInboxIds: selectedUsers,
        });
        return existingGroup?.topic ?? null;
      }
    }))
  );
};

// Add a new hook for accessing the resolved topic
export function useResolvedConversationTopic() {
  return useConversationStoreContext((state) => state.resolvedTopic);
}
```

2. Then simplify the Content component to use the resolved topic:

```typescript:features/conversation/conversation.tsx
const Content = memo(function Content(props: { textPrefill?: string }) {
  const { textPrefill = "" } = props;
  const isCreatingNewConversation = useConversationStoreContext(
    (state) => state.isCreatingNewConversation
  );
  const topic = useResolvedConversationTopic();
  const currentAccount = useCurrentAccount()!;

  const {
    data: conversation,
    isLoading: isLoadingConversation,
    status,
    fetchStatus,
  } = useConversationQuery({
    account: currentAccount,
    topic: topic!, 
    caller: "Conversation screen",
  });

  // ... rest of the component ...

  return (
    <MessageContextMenuStoreProvider>
      <ConversationComposerStoreProvider
        inputValue={textPrefill}
        storeName={topic || "new"}
      >
        <VStack style={{ flex: 1 }}>
          {isCreatingNewConversation && <ConversationNewSearch />}

          <VStack style={{ flex: 1 }}>
            {isCreatingNewConversation && <ConversationSearchResultsList />}
            {conversation ? (
              <Messages conversation={conversation} />
            ) : (
              <VStack style={$globalStyles.flex1} />
            )}
            <ComposerWrapper />
            <KeyboardFillerWrapper />
          </VStack>
        </VStack>
        <MessageReactionsDrawer />
      </ConversationComposerStoreProvider>
    </MessageContextMenuStoreProvider>
  );
});
```

3. Update the Conversation component to use the new prop name:

```typescript:features/conversation/conversation.tsx
export const Conversation = memo(function Conversation(props: {
  topic: ConversationTopic;
  textPrefill?: string;
}) {
  const { topic, textPrefill = "" } = props;

  return (
    <ConversationStoreProvider 
      initialTopic={topic} 
      isCreatingNewConversation={!topic}
    >
      <Content textPrefill={textPrefill} />
    </ConversationStoreProvider>
  );
});
```

Key improvements in this approach:

1. Single source of truth: The topic resolution logic is now centralized in the store
2. Clear separation of concerns: The store handles state management and topic resolution, while components focus on rendering
3. Better encapsulation: Components don't need to know about the internal logic of how topics are resolved
4. More predictable: The topic resolution logic is now in one place and easier to maintain
5. Better TypeScript support: The store state is more clearly typed
6. Easier testing: The topic resolution logic can be tested independently of the UI

This pattern follows the principle of moving complex state management logic into the store while keeping components focused on presentation. The `resolvedTopic` getter in the store handles all the logic for determining the current topic, making the component code much cleaner and easier to understand.

---



---

