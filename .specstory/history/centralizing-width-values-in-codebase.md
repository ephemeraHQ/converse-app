## SpecStory

## Centralizing Width Values in Codebase (1/9/2025, 8:09:18 PM)

_**User**_

I have this width for action that I want to reuse elsewhere. Like if I change the width here, I need another place to also cahnge, Look at my code base and @theme stuff and tell me how would you do this?

---

_**Assistant**_

Based on your theme structure and the code shown, I recommend adding this width to the `spacing` theme since it represents a standardized spacing value. Looking at your `spacing.ts`, you already have values like `"5xl": 80` which is what you're currently using.

Here's how I would modify the code:

1. First, add a new section in `spacing.ts` for swipeable actions:

```typescript:theme/spacing.ts
export const spacing = {
  // ... existing spacing values ...

  swipeableAction: {
    width: 80, // Same as "5xl"
  },
} as const;
```

2. Then update your swipeable component to use this themed value:

```typescript:features/conversation-list/components/conversation-list-item/conversation-list-item-swipeable.tsx
const $actionContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: spacing.swipeableAction.width,
  alignItems: "center",
  justifyContent: "center",
});
```

This approach has several benefits:
1. It centralizes the width value in your theme
2. Makes it easier to maintain consistency across the app
3. Follows your existing pattern of organizing themed values
4. Makes it clear that this is a standardized width for swipeable actions
5. Makes it easier to change the value in one place if needed

The value is still effectively the same (80), but now it's semantically tied to its purpose and centrally managed in your theme system.

---

_**User**_

What other ways there is ? I just feel that @spacing.ts is very generic, should I start adding components styling there?

---

_**Assistant**_

You're right - the `spacing.ts` should remain focused on core spacing values. Based on your code style guide and the structure, here are better alternatives:

1. Create a dedicated constants file for swipeable components:

```typescript:components/swipeable/swipeable.constants.ts
export const SWIPEABLE_CONSTANTS = {
  actionWidth: 80, // Using the same value as spacing["5xl"]
} as const;
```

2. Or, if you have multiple swipeable-related styles, create a dedicated theme file:

```typescript:components/swipeable/swipeable.theme.ts
import { ThemedStyle } from "@/theme/useAppTheme";
import { ViewStyle } from "react-native";

export const swipeableStyles = {
  actionContainer: (({ spacing }) => ({
    width: spacing["5xl"],
    alignItems: "center",
    justifyContent: "center",
  })) satisfies ThemedStyle<ViewStyle>,
} as const;
```

Then in your component:

```typescript:features/conversation-list/components/conversation-list-item/conversation-list-item-swipeable.tsx
import { swipeableStyles } from "@/components/swipeable/swipeable.theme";

// ... rest of the code ...

const $actionContainer = swipeableStyles.actionContainer;
```

I prefer the second approach because:
1. It keeps component-specific styles together
2. Follows your pattern of using themed styles
3. Makes it easier to maintain all swipeable-related styles in one place
4. Keeps `spacing.ts` focused on core spacing values
5. Makes it easier to reuse these styles across different swipeable implementations

This also aligns with your code style guide's principle of keeping related code close together and using TypeScript's type system effectively.

---



---

