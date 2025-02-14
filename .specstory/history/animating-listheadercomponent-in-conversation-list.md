## SpecStory

## Animating ListHeaderComponent in Conversation List (1/17/2025, 9:41:25 AM)

_**User**_

how can i make sure that my list animate when i add a ListHeaderComponent? 

---

_**Assistant**_

To ensure animations work with a ListHeaderComponent in your ConversationList, we need to wrap the ListHeaderComponent in an AnimatedVStack similar to how we're wrapping the list items. Here's how to modify the code:

```typescript:features/conversation-list/conversation-list.tsx
// ... existing code ...

type IConversationListProps = Omit<
  AnimatedProps<FlatListProps<ConversationWithCodecsType>>,
  "data" | "renderItem"
> & {
  conversations: ConversationWithCodecsType[];
  renderConversation?: ListRenderItem<ConversationWithCodecsType>;
  onRefetch?: () => Promise<void>;
  ListHeaderComponent?: React.ReactElement; // Add this prop
};

export function ConversationList(props: IConversationListProps) {
  const {
    conversations,
    renderConversation = defaultRenderItem,
    onRefetch,
    ListHeaderComponent,
    ...rest
  } = props;

  const { theme } = useAppTheme();
  const { onScroll } = useRefreshHandler({ onRefetch });

  // Create animated header component
  const AnimatedHeader = useCallback(() => {
    if (!ListHeaderComponent) return null;
    return (
      <AnimatedVStack
        entering={theme.animation.reanimatedFadeInSpring}
        exiting={theme.animation.reanimatedFadeOutSpring}
      >
        {ListHeaderComponent}
      </AnimatedVStack>
    );
  }, [ListHeaderComponent, theme.animation]);

  return (
    // @ts-expect-error
    <Animated.FlatList
      ListHeaderComponent={AnimatedHeader}
      onScroll={onScroll}
      // ... existing code ...
    />
  );
}

// ... existing code ...
```

The changes:
1. Added `ListHeaderComponent` to the props type definition
2. Created an `AnimatedHeader` component using `useCallback` that wraps the `ListHeaderComponent` in `AnimatedVStack` with the same animations as list items
3. Added the `AnimatedHeader` to the `FlatList` as `ListHeaderComponent`

Now when you pass a `ListHeaderComponent` to `ConversationList`, it will animate with the same fade in/out effects as the list items.

---



---

