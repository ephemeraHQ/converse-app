## SpecStory

## Animating Layout Changes in React Components (1/17/2025, 9:47:33 AM)

_**User**_

I don't understand something here... I have layout for animatnnon but when the height of the compoentn hcange because for example "ConversationListPinnedConversations" return null. the rest doens'T animate!

---

_**Assistant**_

I understand the issue. The `layout` prop on the parent `AnimatedVStack` alone isn't sufficient to animate child components when they mount/unmount or change height. To achieve the animation effect you want, you need to add layout animations to the child components as well.

Here's how to fix it:

```typescript:features/conversation-list/conversation-list.screen.tsx
// ... existing code ...

const ListHeader = React.memo(function ListHeader() {
  const { theme } = useAppTheme();
  const { ephemeralAccount } = useSettingsStore(
    useSelect(["ephemeralAccount"])
  );

  return (
    <AnimatedVStack layout={theme.animation.reanimatedLayoutSpringTransition}>
      <AnimatedVStack layout={theme.animation.reanimatedLayoutSpringTransition}>
        <States />
      </AnimatedVStack>
      
      {ephemeralAccount && (
        <AnimatedVStack layout={theme.animation.reanimatedLayoutSpringTransition}>
          <EphemeralAccountBanner />
        </AnimatedVStack>
      )}
      
      <AnimatedVStack layout={theme.animation.reanimatedLayoutSpringTransition}>
        <ConversationListPinnedConversations />
      </AnimatedVStack>
      
      <AnimatedVStack layout={theme.animation.reanimatedLayoutSpringTransition}>
        <ConversationListAwaitingRequests />
      </AnimatedVStack>
    </AnimatedVStack>
  );
});

// ... existing code ...
```

The changes wrap each child component in an `AnimatedVStack` with its own layout animation. This ensures that:
1. When any component mounts/unmounts, it will animate smoothly
2. When a component's height changes (like when `ConversationListPinnedConversations` returns null), the transition will be animated
3. The surrounding components will smoothly adjust their positions

This creates a cascading animation effect where each section independently animates while maintaining the overall flow of the layout.

---



---

