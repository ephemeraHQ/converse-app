## SpecStory

## TypeScript Optional Props Issue (1/6/2025, 4:10:56 PM)

_**User**_

Why here tpyescript says that renderItem can be null? I give it default value

---

_**Assistant**_

Looking at your code, TypeScript is likely showing this because `renderItem` is coming from `IConversationListProps`, which is defined using `Optional<AnimatedProps<FlatListProps<ConversationWithCodecsType>>, "renderItem">`. 

The issue is that `FlatListProps` from React Native defines `renderItem` as a required prop, but you're making it optional using `Optional`. Here's how to fix it:

```typescript:features/conversation-list/components/conversation-list/conversation-list.tsx
// ... existing code ...

type IConversationListProps = Omit<
  AnimatedProps<FlatListProps<ConversationWithCodecsType>>,
  "renderItem"
> & {
  renderItem?: ListRenderItem<ConversationWithCodecsType>;
};

// ... existing code ...
```

This change:
1. Uses `Omit` to remove the original `renderItem` from `FlatListProps`
2. Adds it back as an optional prop with the correct type
3. Maintains the same functionality but with proper TypeScript typing

This way, TypeScript will understand that while `renderItem` is optional in the props, it will always have a value in the component due to the default value you're providing.

---



---

