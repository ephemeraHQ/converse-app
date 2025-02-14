## SpecStory

## Refactoring Props for Reusability in TypeScript (1/16/2025, 9:54:50 AM)

_**User**_

separate the props outside the component so they can be reused in other places

---

_**Assistant**_

I'll help extract and separate the props type definition. Here are the necessary changes:

```typescript:features/conversation/conversation-messages-list.tsx
// ... existing imports ...

// Extract props type definition
type IConversationMessagesListProps = Omit<
  AnimatedProps<FlatListProps<MessageId>>,
  "renderItem" | "data"
> & {
  messageIds: MessageId[];
  renderMessage: (args: {
    messageId: MessageId;
    index: number;
  }) => ReactElement;
};

export const ConversationMessagesList = memo(function ConversationMessagesList(
  props: IConversationMessagesListProps
) {
  // ... rest of the file remains unchanged ...
```

Changes made:
1. Renamed the type from `ConversationMessagesListProps` to `IConversationMessagesListProps` to follow the TypeScript naming convention from the style guide
2. Moved the type definition outside the component so it can be exported and reused
3. Updated the component's props type reference to use the new type name

The rest of the file remains unchanged since we only needed to extract and rename the props type definition.

---

_**User**_

no like all the stuff here 

---

_**Assistant**_

I'll help extract the common FlatList props into a separate object that can be reused. Here's how we can modify the code:

```typescript:features/conversation/conversation-messages-list.tsx
// ... existing imports ...

const conversationListProps = {
  style: $globalStyles.flex1,
  inverted: true,
  keyboardDismissMode: "interactive" as const,
  keyboardShouldPersistTaps: "handled" as const,
  ItemSeparatorComponent: MessageSeparator,
  showsVerticalScrollIndicator: Platform.OS === "ios", // Size glitch on Android
  layout: theme.animation.reanimatedLayoutSpringTransition,
  itemLayoutAnimation: theme.animation.reanimatedLayoutSpringTransition,
  keyExtractor,
} satisfies Partial<AnimatedProps<FlatListProps<MessageId>>>;

export const ConversationMessagesList = memo(function ConversationMessagesList(
  props: IConversationMessagesListProps
) {
  const { messageIds, renderMessage, ...rest } = props;
  const { theme } = useAppTheme();
  const scrollRef = useAnimatedRef<FlatList<MessageId>>();
  
  // ... rest of useEffect and other logic ...

  return (
    // @ts-expect-error
    <Animated.FlatList
      {...conversationListProps}
      ref={scrollRef}
      data={messageIds}
      renderItem={({ item, index }) =>
        renderMessage({
          messageId: item,
          index,
        })
      }
      {...rest}
    />
  );
});
```

Changes made:
1. Created a `conversationListProps` object that contains all the common FlatList props
2. Used `satisfies` operator to ensure type safety while allowing type inference
3. Simplified the FlatList component by spreading the common props
4. Kept the dynamic props (`ref`, `data`, `renderItem`) directly in the component

Note: You'll need to move this object inside the component if you need access to the `theme` object, or you could create a function that returns these props taking theme as a parameter. Let me know if you'd prefer either of those approaches!

---

_**User**_

For the code present, we get this error:
```
Argument of type '(options?: RefetchOptions | undefined) => Promise<QueryObserverResult<Conversation<SupportedCodecsType>[], Error>>' is not assignable to parameter of type '() => void | Promise<void>'.
  Type 'Promise<QueryObserverResult<Conversation<SupportedCodecsType>[], Error>>' is not assignable to type 'void | Promise<void>'.
    Type 'Promise<QueryObserverResult<Conversation<SupportedCodecsType>[], Error>>' is not assignable to type 'Promise<void>'.
      Type 'QueryObserverResult<Conversation<SupportedCodecsType>[], Error>' is not assignable to type 'void'.
        Type 'QueryObserverRefetchErrorResult<Conversation<SupportedCodecsType>[], Error>' is not assignable to type 'void'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error occurs because `useScreenFocusEffectOnce` expects a function that returns `void` or `Promise<void>`, but `refetchConversations` returns a query result. Here's the fix:

```typescript:features/conversation-list/conversation-list.screen.tsx
// ... existing code ...
useScreenFocusEffectOnce(() => {
  void refetchConversations();
});
// ... existing code ...
```

This wraps the call in a void function that matches the expected type signature.

---



---

