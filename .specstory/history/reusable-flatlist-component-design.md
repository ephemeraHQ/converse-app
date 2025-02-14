## SpecStory

## Reusable FlatList Component Design (1/15/2025, 3:41:07 PM)

_**User**_

I need to reuse this flatList but not with the Animated. Some comp need the Animated tho. How could I do this" I'm thinking creating a new component that isn't animated.flatList but then I mihgt duplicate some default props no?

---

_**Assistant**_

I'll help you create a base component that can be reused for both animated and non-animated versions while avoiding prop duplication. Here's how we can refactor this:

```typescript:features/conversation/conversation-messages-list.tsx
// ... existing imports ...
import { FlatList as RNFlatList } from "react-native";

type BaseMessagesListProps = Omit<
  FlatListProps<MessageId>,
  "renderItem" | "data"
> & {
  messageIds: MessageId[];
  renderMessage: (args: {
    messageId: MessageId;
    index: number;
  }) => ReactElement;
  scrollRef?: React.RefObject<RNFlatList<MessageId>>;
};

// Base component with shared props and logic
const BaseMessagesList = memo(function BaseMessagesList(
  props: BaseMessagesListProps
) {
  const { messageIds, renderMessage, scrollRef, ...rest } = props;
  const { theme } = useAppTheme();

  return (
    <RNFlatList
      ref={scrollRef}
      style={$globalStyles.flex1}
      inverted={true}
      data={messageIds}
      renderItem={({ item, index }) =>
        renderMessage({
          messageId: item,
          index,
        })
      }
      keyboardDismissMode="interactive"
      keyExtractor={keyExtractor}
      keyboardShouldPersistTaps="handled"
      ItemSeparatorComponent={() => <MessageSeparator />}
      showsVerticalScrollIndicator={Platform.OS === "ios"}
      {...rest}
    />
  );
});

// Animated version
export const ConversationMessagesList = memo(function ConversationMessagesList(
  props: ConversationMessagesListProps
) {
  const { messageIds, renderMessage, ...rest } = props;
  const scrollRef = useAnimatedRef<FlatList<MessageId>>();
  const { theme } = useAppTheme();
  const conversationStore = useConversationStore();

  // ... existing useEffect for scroll handling ...

  return (
    // @ts-expect-error
    <Animated.FlatList
      ref={scrollRef}
      style={$globalStyles.flex1}
      inverted={true}
      data={messageIds}
      renderItem={({ item, index }) =>
        renderMessage({
          messageId: item,
          index,
        })
      }
      layout={theme.animation.reanimatedLayoutSpringTransition}
      itemLayoutAnimation={theme.animation.reanimatedLayoutSpringTransition}
      keyboardDismissMode="interactive"
      keyExtractor={keyExtractor}
      keyboardShouldPersistTaps="handled"
      ItemSeparatorComponent={() => <MessageSeparator />}
      showsVerticalScrollIndicator={Platform.OS === "ios"}
      {...rest}
    />
  );
});

// Non-animated version
export const StaticMessagesList = memo(function StaticMessagesList(
  props: BaseMessagesListProps
) {
  return <BaseMessagesList {...props} />;
});

// ... rest of the existing code (keyExtractor and MessageSeparator) ...
```

This refactoring:
1. Creates a base component `BaseMessagesList` with all shared props and functionality
2. Keeps the existing animated version (`ConversationMessagesList`)
3. Adds a new non-animated version (`StaticMessagesList`)
4. Makes the scroll ref optional in the base component
5. Maintains all the common props and behavior between both versions

You can now use either:
- `<ConversationMessagesList />` when you need animations
- `<StaticMessagesList />` when you don't need animations

Both components will share the same base functionality and props, preventing code duplication.

---



---

