## SpecStory

## Creating a Reusable Swipeable Component (1/9/2025, 8:12:49 PM)

_**User**_

I want to create a reusable comp like ConversationListItemSwipeable

It will render Swipeable with some of those props already predefined but also will take props to will spread becaue depending on the caller we'll add props



---

_**Assistant**_

I'll help you create a reusable Swipeable component based on the code you provided. Here's how we can implement it:

```typescript:features/conversation-list/components/conversation-list-item/conversation-list-item-swipeable.tsx
import { Swipeable, SwipeableProps } from "react-native-gesture-handler";
import { useAppTheme } from "@/theme/useAppTheme";
import { memo } from "react";

type IConversationListItemSwipeableProps = Partial<SwipeableProps> & {
  onLeftSwipe?: () => void;
  onRightSwipe?: () => void;
};

export const ConversationListItemSwipeable = memo(
  ({ children, onLeftSwipe, onRightSwipe, ...props }: IConversationListItemSwipeableProps) => {
    const { theme } = useAppTheme();

    return (
      <Swipeable
        closeOnOpen
        leftThreshold={theme.spacing["5xl"]}
        leftActionsBackgroundColor={theme.colors.fill.caution}
        rightActionsBackgroundColor={theme.colors.fill.minimal}
        onLeftSwipe={onLeftSwipe}
        onRightSwipe={onRightSwipe}
        {...props}
      >
        {children}
      </Swipeable>
    );
  }
);

// ... rest of your existing code (ConversationListItemSwipeableAction, etc.) ...
```

This implementation:
1. Creates a new reusable component that pre-configures common Swipeable props
2. Allows overriding any Swipeable prop through props spreading
3. Maintains the theme-based styling
4. Uses memo for performance optimization

You can now use it like this:

```typescript
<ConversationListItemSwipeable
  renderRightActions={renderRightActions}
  renderLeftActions={renderLeftActions}
  onLeftSwipe={deleteDm}
  onRightSwipe={toggleReadStatus}
>
  {/* children */}
</ConversationListItemSwipeable>
```

---

_**User**_

I think I like having something like this in `layout.ts` even if it's at the root what do you think? I just feel at least it's a one place... Otherwise I always need to create new style file? What do you think?

---

_**Assistant**_

Yes, having these layout-related constants in `layout.ts` is a good practice for several reasons:

1. **Single Source of Truth**: It provides one centralized place for layout-related constants, making it easier to maintain consistency across the app.

2. **Theme Integration**: Since it's part of the theme system, it naturally integrates with other theme values (like spacing) and can be accessed through the theme context.

3. **Reusability**: When multiple components need the same layout values, they can reference them from a single source rather than duplicating values across different style files.

4. **Maintainability**: If you need to adjust these values later, you only need to change them in one place.

For the swipeable threshold specifically, it makes sense to keep it in `layout.ts` because:
- It's a layout-specific value (relates to spatial dimensions)
- It might be reused for other swipeable components in the future
- It's tied to your app's overall spacing system

You could even make it more generic if you plan to have more swipeable components:

```typescript:theme/layout.ts
// ... existing code ...

  swipeable: {
    threshold: {
      conversation: spacing["5xl"],
      // You can add other swipeable thresholds here if needed
      default: spacing["5xl"],
    },
  },

// ... existing code ...
```

This approach is better than:
- Creating separate style files for each component
- Hardcoding values in component files
- Duplicating these values across different parts of the app

---



---

