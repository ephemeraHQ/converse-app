## SpecStory

## Best Practices for Layout Management in React Native (1/8/2025, 1:08:38 PM)

_**User**_

so what's wierd is i have layout stuff in here but not ALL my layout stuff is there... for exmaple lots styling will be inline when I use componets in conversationList. What do you think is good practice here?

---

_**Assistant**_

Let me help you establish some best practices for managing layout configurations in your React Native app.

Here are my recommendations:

1. **Centralize Layout Constants**: The `layout.ts` file should contain all reusable layout values that are used across multiple components. This includes:
   - Screen-level measurements
   - Common component dimensions
   - Grid systems
   - Standard spacing patterns

2. **Component-Specific vs Global Layout**: 
   - **Global Layout**: Put values in `layout.ts` if they are:
     - Used across multiple components
     - Define core layout structure
     - Represent app-wide standards
   - **Component Layout**: Keep values in component files if they are:
     - Specific to one component
     - Unlikely to be reused
     - Tightly coupled to component logic

Here's how I would restructure your layout.ts:

```typescript:theme/layout.ts
import { avatarSize } from "@theme/avatar";
import { Dimensions } from "react-native";
import { spacing } from "./spacing";

const window = {
  width: Dimensions.get("window").width,
  height: Dimensions.get("window").height,
};

export const layout = {
  screen: {
    width: window.width,
    height: window.height,
  },
  
  // Common screen patterns
  screenPadding: {
    horizontal: spacing.lg,
    onboarding: spacing.lg,
  },
  
  // Grid systems
  grid: {
    columns: {
      triple: 3,
      double: 2,
    },
    getColumnWidth: ({ totalColumns, horizontalPadding, gap }: {
      totalColumns: number;
      horizontalPadding: number;
      gap: number;
    }) => {
      return (
        (window.width - horizontalPadding * 2 - gap * (totalColumns - 1)) /
        totalColumns
      );
    },
  },
  
  // Common component layouts
  components: {
    avatar: {
      chat: {
        width: avatarSize.sm,
        height: avatarSize.sm,
      },
    },
  },
};

export type ILayout = typeof layout;
```

Key improvements:
1. Grouped related values into logical sections
2. Added a reusable `getColumnWidth` function instead of hardcoding the calculation
3. Separated screen-level, grid-level, and component-level configurations
4. Moved specific implementation details (like the pinned conversation layout) to their respective components

For your conversation list component, I would:
1. Keep component-specific styles in the component file
2. Use the layout utilities for calculations:

```typescript:components/conversation-list.tsx
// Inside your component
const columnWidth = layout.grid.getColumnWidth({
  totalColumns: layout.grid.columns.triple,
  horizontalPadding: spacing.lg,
  gap: spacing.sm,
});

// Component-specific styles stay here
const styles = {
  pinnedContainer: {
    padding: layout.screenPadding.horizontal,
    gap: spacing.sm,
  },
  pinnedAvatar: {
    width: columnWidth,
    height: columnWidth,
  },
};
```

This approach gives you:
- Better separation of concerns
- More reusable layout utilities
- Clearer distinction between global and component-specific layouts
- Easier maintenance and updates to layout systems

---

_**User**_

I Like that , but what if there are 2 places where I use exaclty the same 

const columnWith = ...

Like I'll use in @conversation-list-avatar-skeleton.tsx  and in @PinnedConversation.tsx 

---

_**Assistant**_

Ah, good point! When you have shared layout logic that's specific to a feature, you should create a shared hook or utility within that feature folder. Here's how I'd structure it:

```typescript:features/conversation-list/hooks/useConversationListLayout.ts
import { layout } from "@/theme/layout";
import { spacing } from "@/theme/spacing";

export function useConversationListLayout() {
  const pinnedAvatarSize = layout.grid.getColumnWidth({
    totalColumns: layout.grid.columns.triple,
    horizontalPadding: spacing.lg,
    gap: spacing.sm,
  });

  return {
    pinnedAvatarSize,
  } satisfies const;
}
```

Then use it in both components:

```typescript:features/conversation-list/components/conversation-list-avatar-skeleton.tsx
// ... imports
import { useConversationListLayout } from "../hooks/useConversationListLayout";

export const ConversationListAvatarSkeleton = memo(
  function ConversationListAvatarSkeleton(props: { color: string }) {
    const { color } = props;
    const { pinnedAvatarSize } = useConversationListLayout();

    return (
      <Center
        style={{
          width: pinnedAvatarSize,
          height: pinnedAvatarSize,
          // ... rest of styles
        }}
      >
        // ... rest of component
      </Center>
    );
  }
);
```

```typescript:features/conversation-list/PinnedConversations/PinnedConversation.tsx
// ... imports
import { useConversationListLayout } from "../hooks/useConversationListLayout";

export const PinnedConversation: FC<PinnedConversationProps> = ({
  // ... props
}) => {
  const { themed, theme } = useAppTheme();
  const { pinnedAvatarSize } = useConversationListLayout();

  // Use pinnedAvatarSize in your styles
  const $container: ThemedStyle<ViewStyle> = (theme) => ({
    gap: theme.spacing.xxs,
    justifyContent: "center",
    alignItems: "center",
    width: pinnedAvatarSize,  // Here
  });

  // ... rest of component
};
```

This approach:
1. Keeps the layout logic DRY
2. Makes it easy to update the layout calculation in one place
3. Keeps feature-specific layout logic within the feature folder
4. Follows the custom hook pattern for reusable logic
5. Maintains type safety with `satisfies const`

The layout hook belongs in the feature folder because it's specific to the conversation list feature, rather than being a global layout utility.

---



---

