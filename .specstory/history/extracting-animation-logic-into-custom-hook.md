## SpecStory

## Extracting Animation Logic into Custom Hook (12/19/2024, 12:32:22 PM)

_**User**_

how to extract the animation in an external hook

---

_**Assistant**_

I'll help you extract the animation logic into a custom hook. Here's how to refactor the code:

First, create a new hook file:

```typescript:features/conversation/hooks/useHighlightAnimation.ts
import { useEffect } from "react";
import {
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useConversationStore } from "../conversation.store-context";
import { useAppTheme } from "@/theme/useAppTheme";

type IUseHighlightAnimationArgs = {
  messageId: string;
};

export function useHighlightAnimation(args: IUseHighlightAnimationArgs) {
  const { messageId } = args;
  const { theme } = useAppTheme();
  const conversationStore = useConversationStore();
  const isHighlightedAV = useSharedValue(0);

  useEffect(() => {
    const unsubscribe = conversationStore.subscribe(
      (state) => state.highlightedMessageId,
      (highlightedMessageId) => {
        cancelAnimation(isHighlightedAV);

        if (!highlightedMessageId) {
          isHighlightedAV.value = withSpring(0, {
            stiffness: theme.animation.spring.stiffness,
            damping: theme.animation.spring.damping,
          });
          return;
        }

        if (messageId !== highlightedMessageId) {
          return;
        }

        isHighlightedAV.value = withSpring(
          1,
          {
            stiffness: theme.animation.spring.stiffness,
            damping: theme.animation.spring.damping,
          },
          () => {
            runOnJS(conversationStore.setState)({
              highlightedMessageId: undefined,
            });
          }
        );
      }
    );
    return () => unsubscribe();
  }, [conversationStore, isHighlightedAV, theme, messageId]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(isHighlightedAV.value, [0, 1], [1, 0.5]),
  }));

  return { animatedStyle };
}
```

Then simplify the component:

```typescript:features/conversation/conversation.tsx
// ... existing imports ...

const ConversationMessageHighlighted = memo(function ConversationMessageHighlighted(props: {
  children: React.ReactNode;
}) {
  const { children } = props;
  const { messageId } = useMessageContextStoreContext(useSelect(["messageId"]));
  const { animatedStyle } = useHighlightAnimation({ messageId });

  return (
    <AnimatedVStack style={[{ width: "100%" }, animatedStyle]}>
      {children}
    </AnimatedVStack>
  );
});
```

Key changes made:
1. Created a new custom hook `useHighlightAnimation` that encapsulates all the animation logic
2. The hook takes a `messageId` parameter and returns the `animatedStyle`
3. Simplified the component to only handle the rendering logic
4. Maintained all the existing functionality while making the code more modular and reusable

The animation logic is now cleanly separated from the component, making it easier to maintain and potentially reuse in other parts of the application if needed.

---



---

