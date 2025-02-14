## SpecStory

## Chip Height Calculation Function (2/4/2025, 3:29:18 PM)

_**User**_

i need a way to get the chip height. maybe a hook? Or a function ? Whatever is cleaner

---

_**Assistant**_

I'll help you create a function to calculate the chip height based on the size prop. Since the height calculation involves theme values and we want to keep it consistent, let's create a utility function.

```typescript:design-system/chip.tsx
// ... existing code ...

// Add this function before the Chip component
function getChipHeight({ size, theme }: { size: "sm" | "md"; theme: Theme }) {
  // Because in Figma border is included in height
  return theme.spacing.md;
}

export function Chip({
  name,
  avatarUri,
  isSelected,
  onPress,
  size = "sm",
}: ChipProps) {
  const { themed, theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[themed($container), isSelected && themed($selectedContainer)]}
    >
      <Center
        style={{
          columnGap: theme.spacing.xxxs,
          height: getChipHeight({ size, theme }),
        }}
      >
        // ... existing code ...
      </Center>
    </Pressable>
  );
}

// ... existing code ...
```

I've added a `getChipHeight` function that takes the size prop and theme as parameters. This approach is cleaner than a hook since:
1. It's a pure function with no side effects
2. It doesn't introduce any reactivity/state management
3. It keeps the height calculation logic in one place and makes it reusable
4. It follows our functional programming patterns with object parameters

Note that I kept the existing logic for now since you might have specific requirements for the height calculation. You can modify the calculation inside the function if needed.

---



---

