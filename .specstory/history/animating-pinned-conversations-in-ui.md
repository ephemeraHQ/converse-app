## SpecStory

## Animating Pinned Conversations in UI (1/8/2025, 11:47:01 AM)

_**User**_

i want that when I add/remove pinnedConversation, it animates

---

_**Assistant**_

I'll help you add animation when adding/removing pinned conversations. We'll use Reanimated's entering/exiting animations. Here are the necessary changes:

```typescript:features/conversation-list/PinnedConversations/PinnedConversations.tsx
import { AnimatedHStack } from "@/design-system/HStack";
// ... existing imports ...
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

// ... existing code ...

const PinnedConversation = memo(function PinnedConversation(props: {
  topic: ConversationTopic;
}) {
  const { topic } = props;
  const conversation = useConversationListConversation(topic);

  if (!conversation) {
    captureError(
      new Error(`Couldn't find conversation ${topic} in PinnedConversation`)
    );
    return null;
  }

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      {isConversationGroup(conversation) ? (
        <PinnedV3GroupConversation group={conversation} />
      ) : (
        <PinnedV3DMConversation conversation={conversation} />
      )}
    </Animated.View>
  );
});
```

The changes:
1. Added import for Reanimated's animation utilities
2. Wrapped the pinned conversation content in an `Animated.View` with `entering` and `exiting` animations
3. Simplified the conditional rendering using a ternary operator inside the `Animated.View`

Now when conversations are added or removed from the pinned list, they will fade in/out smoothly. The `AnimatedHStack` you're already using will handle the layout animation for repositioning the remaining items.

---

_**User**_

But can the whole list animate also? like the elements around 

---

_**Assistant**_

Yes! We can animate the entire container and its layout changes. Since you're already using `AnimatedHStack`, we can enhance the animation by adding layout animations to the container and the individual items:

```typescript:features/conversation-list/PinnedConversations/PinnedConversations.tsx
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";

// ... existing code ...

export const ConversationListPinnedConversations = memo(
  function ConversationListPinnedConversations() {
    // ... existing code ...

    return (
      <AnimatedHStack
        style={themed($container)}
        layout={Layout.springify()}
      >
        {pinnedConversationTopics.map((topic) => (
          <Animated.View 
            key={topic} 
            entering={FadeIn} 
            exiting={FadeOut}
            layout={Layout.springify()}
          >
            <PinnedConversation topic={topic} />
          </Animated.View>
        ))}
      </AnimatedHStack>
    );
  }
);
```

The changes:
1. Added `Layout` import from Reanimated
2. Replaced the `theme.animation.reanimatedLayoutSpringTransition` with `Layout.springify()` for consistent animation across container and items
3. Wrapped each `PinnedConversation` in an `Animated.View` with both fade and layout animations

Now when you add/remove conversations:
- The individual items will fade in/out
- The remaining items will smoothly animate to their new positions
- The container will smoothly resize to accommodate the changes

This creates a more fluid and cohesive animation experience throughout the entire list.

---



---

