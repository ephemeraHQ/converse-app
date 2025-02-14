## SpecStory

## Adding Size Prop to Chip Component (2/4/2025, 3:26:11 PM)

_**User**_

we need an additional props whichi will be size which will be either "sm" or "md" if small the only thing changing is the preset of the text. if "sm", the preset is "small" if not we put "body". By default size is "sm"

---

_**Assistant**_

I'll help you modify the Chip component to add the size prop. Here's the updated code with the necessary changes:

```typescript:design-system/chip.tsx
// ... existing code ...

type ChipProps = {
  name: string;
  avatarUri?: string;
  isSelected?: boolean;
  onPress?: () => void;
  size?: "sm" | "md";
};

export function Chip({ name, avatarUri, isSelected, onPress, size = "sm" }: ChipProps) {
  const { themed, theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[themed($container), isSelected && themed($selectedContainer)]}
    >
      <Center
        style={{
          columnGap: theme.spacing.xxxs,
          height:
            theme.spacing.md -
            theme.borderWidth.sm * 2,
        }}
      >
        <Avatar uri={avatarUri} name={name} size={theme.avatarSize.xs} />
        <Text preset={size === "sm" ? "small" : "body"}>{name}</Text>
      </Center>
    </Pressable>
  );
}

// ... existing code ...
```

Changes made:
1. Added `size?: "sm" | "md"` to the `ChipProps` type
2. Added `size = "sm"` as a default parameter in the component props destructuring
3. Updated the `Text` component's preset to use a ternary that checks the size prop: `preset={size === "sm" ? "small" : "body"}`

---



---

