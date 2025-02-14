## SpecStory

## Code Modification: Replace Pressable with Center (1/9/2025, 3:25:33 PM)

_**User**_

remove onPress props and just put regular Center instead of pressable

---

_**Assistant**_

I'll help modify the code to remove the `onPress` prop and replace `Pressable` with `Center`. Here are the changes:

```typescript:features/conversation-list/components/conversation-list-item/conversation-list-item-swipeable.tsx
// ... existing imports ...
import { Center } from "@/design-system/Center"; // Update import
// Remove Pressable import

type IConversationListItemSwipeableActionProps = {
  icon: IIconName;
  iconColor?: string;
  color: string;
  containerStyle?: ViewStyle;
  iconProps?: Partial<Omit<IIconProps, "icon" | "picto">>;
  actionProgress: Animated.SharedValue<number>;
  // Removed onPress prop
};

export function ConversationListItemSwipeableAction({
  icon,
  containerStyle,
  iconColor,
  iconProps,
  color,
  actionProgress,
}: IConversationListItemSwipeableActionProps) {
  // ... existing code ...

  return (
    <Center
      style={[
        themed($actionContainer),
        containerStyle,
        { backgroundColor: color },
      ]}
    >
      <AnimatedCenter style={iconAnimatedStyle}>
        <Icon
          icon={icon}
          color={iconColor}
          size={theme.iconSize.md}
          {...iconProps}
        />
      </AnimatedCenter>
    </Center>
  );
}

// ... existing styles ...
```

Changes made:
1. Removed `Pressable` import and added `Center` import
2. Removed `onPress` from the props type
3. Replaced `Pressable` component with `Center`
4. Removed `onPress` prop from component destructuring

---



---

