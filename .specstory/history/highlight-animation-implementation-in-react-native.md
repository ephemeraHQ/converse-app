## SpecStory

## Highlight Animation Implementation in React Native (12/19/2024, 10:48:35 AM)

_**User**_

I want the highlight animation to last like 300ms and then we can reset isHighlighted to false

---

_**Assistant**_

I'll help you modify the `ConversationMessageHighlighted` component to include a timed animation that automatically resets the highlighted state. Here's how we can update it using react-native-reanimated's withTiming:

```typescript:features/conversation/conversation.tsx
const ConversationMessageHighlighted = memo(function ConversationMessageHighlighted(props: {
  children: React.ReactNode;
}) {
  const { children } = props;

  const messageStore = useMessageContextStore();
  const isHighlightedAV = useSharedValue(0);

  useEffect(() => {
    const unsubscribe = messageStore.subscribe(
      (state) => state.isHighlighted,
      (isHighlighted) => {
        if (isHighlighted) {
          // Animate to highlighted state
          isHighlightedAV.value = withTiming(1, { duration: 300 }, () => {
            // Reset the store state after animation completes
            runOnJS(messageStore.setState)({ isHighlighted: false });
            // Animate back to normal state
            isHighlightedAV.value = withTiming(0, { duration: 300 });
          });
        }
      }
    );
    return () => unsubscribe();
  }, [messageStore, isHighlightedAV]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(isHighlightedAV.value, [0, 1], [1, 0.5]),
  }));

  return <AnimatedVStack style={animatedStyle}>{children}</AnimatedVStack>;
});
```

Key changes:
1. Added `withTiming` for smooth animation with 300ms duration
2. Used the completion callback of `withTiming` to reset the store state
3. Added `runOnJS` to safely call setState from the worklet
4. Added another `withTiming` to animate back to the normal state

Don't forget to import these additional functions from react-native-reanimated:

```typescript
import { interpolate, useAnimatedStyle, useSharedValue, withTiming, runOnJS } from "react-native-reanimated";
```

---

_**User**_

For the code present, we get this error:
```
Type 'AnimatedRef<Component<{}, {}, any>>' is not assignable to type 'Ref<Component<FlashListProps<any>, any, any> | LegacyRef<Component<FlashListProps<any>, any, any>>> | undefined'.
  Type 'AnimatedRef<Component<{}, {}, any>>' is not assignable to type '(instance: Component<FlashListProps<any>, any, any> | LegacyRef<Component<FlashListProps<any>, any, any>> | null) => void'.
    Types of parameters 'component' and 'instance' are incompatible.
      Type 'Component<FlashListProps<any>, any, any> | LegacyRef<Component<FlashListProps<any>, any, any>> | null' is not assignable to type 'Component<{}, {}, any> | undefined'.
        Type 'null' is not assignable to type 'Component<{}, {}, any> | undefined'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The issue is with the ref type mismatch. Here's the fix:

```typescript:features/conversation/conversation-messages-list.tsx
// ... existing code ...
const scrollRef = useAnimatedRef<FlashList<MessageId>>();

return (
  <AnimatedFlashList
    inverted={true}
    ref={scrollRef}
    data={messageIds}
// ... rest of the code
```

The key change is adding the generic type `FlashList<MessageId>` to `useAnimatedRef` to properly type the ref for FlashList.

---



---

