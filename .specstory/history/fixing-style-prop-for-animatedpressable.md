## SpecStory

## Fixing Style Prop for AnimatedPressable (1/9/2025, 2:45:22 PM)

_**User**_

how. cani. fix props here beause i have animatedPressable so I feel style should be different

---

_**Assistant**_

I understand you're concerned about the style prop typing because you're using AnimatedPressable. Let's fix the type definitions to properly handle animated styles.

```typescript:features/conversation-list/components/conversation-list-item/conversation-list-item-swipeable.tsx
import { ViewStyle, Animated } from "react-native";
// ... other imports ...

type IConversationListItemSwipeableActionProps = {
  icon: IIconName;
  iconColor?: string;
  color: string;
  onPress?: () => void;
  style?: ThemedStyle<ViewStyle> | Animated.AnimatedProps<ViewStyle>;
  iconProps?: Partial<Omit<IIconProps, "icon" | "picto">>;
};

export function ConversationListItemSwipeableAction({
  icon,
  onPress,
  style,
  iconColor,
  iconProps,
  color,
}: IConversationListItemSwipeableActionProps) {
  // ... rest of the component remains the same ...
}
```

Key changes made:
1. Added a separate type definition for the props to improve readability
2. Modified the `style` prop type to accept both regular themed styles and animated styles using `Animated.AnimatedProps<ViewStyle>`
3. Added `Animated` import from react-native

This change will properly type the style prop to handle both regular themed styles and animated styles that might be passed to the AnimatedPressable component.

---



---

