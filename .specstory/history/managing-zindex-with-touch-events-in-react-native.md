## SpecStory

## Managing zIndex with Touch Events in React Native (1/30/2025, 10:51:19 AM)

_**User**_

ontouchStart set a shareValue to 1 and so it will set the zIndex to 999

---

_**Assistant**_

I'll help you modify the ConversationListItemDmWrapper to set a shared value for zIndex. Here's how to update the code:

```typescript:features/conversation-list/conversation-list.screen.tsx
// ... existing code ...

const ConversationListItemDmWrapper = memo(
  function ConversationListItemDmWrapper(props: { dm: DmWithCodecsType }) {
    const { dm } = props;
    const { theme } = useAppTheme();
    
    // Add shared value for zIndex
    const zIndexValue = useSharedValue(0);

    const contextMenuProps = useDmConversationContextMenuViewProps({
      dmConversationTopic: dm.topic,
    });

    const animatedStyle = useAnimatedStyle(() => ({
      zIndex: zIndexValue.value,
    }));

    return (
      <Animated.View style={animatedStyle}>
        <ContextMenuView
          style={{
            backgroundColor: theme.colors.background.surfaceless,
          }}
          onTouchStart={() => {
            zIndexValue.value = 999;
          }}
          onTouchEnd={() => {
            zIndexValue.value = 0;
          }}
          {...contextMenuProps}
        >
          <ConversationListItemDm conversationTopic={dm.topic} />
        </ContextMenuView>
      </Animated.View>
    );
  }
);

// ... existing code ...
```

The changes include:
1. Added a `useSharedValue` hook to manage the zIndex value
2. Created an animated style using `useAnimatedStyle`
3. Wrapped the ContextMenuView in an Animated.View to apply the zIndex animation
4. Updated onTouchStart to set zIndex to 999
5. Added onTouchEnd to reset zIndex back to 0

Don't forget to import the necessary components from react-native-reanimated:

```typescript:features/conversation-list/conversation-list.screen.tsx
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
```

---



---

