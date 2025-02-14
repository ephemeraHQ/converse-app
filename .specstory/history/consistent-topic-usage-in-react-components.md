## SpecStory

## Consistent Topic Usage in React Components (2/5/2025, 2:24:21 PM)

_**User**_

the topic we use here needs to be the topic in conversationStoreProvider

---

_**Assistant**_

I'll help you update the code to use the topic from the ConversationStoreProvider. Here's how we can modify the code:

```typescript:features/conversation/conversation.screen.tsx
// ... existing code ...
        <ConversationMessageContextMenuStoreProvider>
          <ConversationComposerStoreProvider
            inputValue={composerTextPrefill}
            // Use the same topic value that was passed to ConversationStoreProvider
            storeName={topic ?? "new"}
          >
            <Content />
          </ConversationComposerStoreProvider>
        </ConversationMessageContextMenuStoreProvider>
// ... existing code ...
```

The issue is that we're using the `topic` directly from the props, but we should be consistent with the value passed to `ConversationStoreProvider`. Since we're passing `topic ?? null` to the `ConversationStoreProvider`, we should use the same pattern here.

You can either:
1. Use the store's topic value by adding a selector above the ConversationComposerStoreProvider, or
2. Be consistent with the null coalescing and use `topic ?? "new"` in both places

The first approach is generally better as it ensures we're using the same value from the store. Here's how that would look:

```typescript:features/conversation/conversation.screen.tsx
export const ConversationScreen = memo(function ConversationScreen(
  props: NativeStackScreenProps<NavigationParamList, "Conversation">
) {
  const {
    topic,
    composerTextPrefill = "",
    searchSelectedUserInboxIds = [],
    isNew = false,
  } = props.route.params;

  // Get topic from the store
  const storeTopic = useConversationStoreContext((state) => state.topic);

  return (
    <Screen contentContainerStyle={$globalStyles.flex1}>
      <ConversationStoreProvider
        topic={topic ?? null}
        isCreatingNewConversation={isNew}
        searchSelectedUserInboxIds={searchSelectedUserInboxIds}
      >
        <ConversationMessageContextMenuStoreProvider>
          <ConversationComposerStoreProvider
            inputValue={composerTextPrefill}
            storeName={storeTopic ?? "new"}
          >
            <Content />
          </ConversationComposerStoreProvider>
        </ConversationMessageContextMenuStoreProvider>
      </ConversationStoreProvider>
    </Screen>
  );
});
```

This ensures we're using the same topic value throughout the component hierarchy.

---

_**User**_

but i can't access the storeTopic above the provider...

---

_**Assistant**_

Ah, you're absolutely right - we can't access the store context before its provider is mounted. In this case, we should be consistent with how we handle the topic value in both places. Let's modify it to use the same pattern:

```typescript:features/conversation/conversation.screen.tsx
// ... existing code ...
      <ConversationStoreProvider
        topic={topic ?? null}
        isCreatingNewConversation={isNew}
        searchSelectedUserInboxIds={searchSelectedUserInboxIds}
      >
        <ConversationMessageContextMenuStoreProvider>
          <ConversationComposerStoreProvider
            inputValue={composerTextPrefill}
            storeName={topic ?? null}
          >
            <Content />
          </ConversationComposerStoreProvider>
        </ConversationMessageContextMenuStoreProvider>
      </ConversationStoreProvider>
// ... existing code ...
```

This way, we're using the same `topic ?? null` pattern in both places, ensuring consistency in how we handle the topic value. The `storeName` prop will receive `null` when there's no topic, which should be handled appropriately in the composer store.

---

_**User**_

For the code present, we get this error:
```
React Hook "useCurrentConversationTopic" cannot be called inside a callback. React Hooks must be called in a React function component or a custom React Hook function.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

Ah, we need to move the render function into a separate component since we can't use hooks in callbacks. Here's the fix:

```typescript:features/conversation/conversation.screen.tsx
// ... existing code ...
      <ConversationStoreProvider
        topic={topic ?? null}
        isCreatingNewConversation={isNew}
        searchSelectedUserInboxIds={searchSelectedUserInboxIds}
      >
        <ConversationMessageContextMenuStoreProvider>
          <ComposerWrapper composerTextPrefill={composerTextPrefill} />
        </ConversationMessageContextMenuStoreProvider>
      </ConversationStoreProvider>
// ... existing code ...

const ComposerWrapper = memo(function ComposerWrapper({ 
  composerTextPrefill 
}: { 
  composerTextPrefill: string 
}) {
  const topic = useCurrentConversationTopic();
  return (
    <ConversationComposerStoreProvider
      inputValue={composerTextPrefill}
      storeName={topic ?? "new"}
    >
      <Content />
    </ConversationComposerStoreProvider>
  );
});
```

---



---

