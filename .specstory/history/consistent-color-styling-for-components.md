## SpecStory

## Consistent Color Styling for Components (2/5/2025, 2:09:07 PM)

_**User**_

fix color based on avatar name color

---

_**Assistant**_

I'll help modify the `ExtraMembersIndicator` component to use the same color styling approach as the Avatar component. Here's the change:

```typescript:components/group-avatar.tsx
// ... existing code ...

const ExtraMembersIndicator: React.FC<{
  pos: Position;
  extraMembersCount: number;
  size: number;
}> = ({ pos, extraMembersCount, size }) => {
  const { themed } = useAppTheme();

  return (
    <Center
      style={[
        themed($extraMembersContainer),
        {
          left: (pos.x / 100) * size,
          top: (pos.y / 100) * size,
          width: (pos.size / 100) * size,
          height: (pos.size / 100) * size,
          borderRadius: ((pos.size / 100) * size) / 2,
        },
      ]}
    >
      <Text
        style={[
          themed($extraMembersText),
          {
            fontSize: ((pos.size / 100) * size) / 2,
          },
        ]}
      >
        +{extraMembersCount}
      </Text>
    </Center>
  );
};

// ... existing code ...

const $extraMembersText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontWeight: "bold",
  color: colors.text.secondary,
});
```

The changes:
1. Removed the `color="secondary"` prop from the Text component since we want to control the color through the themed style
2. Updated the `$extraMembersText` style to use `colors.text.secondary` to match the intended color scheme

This change makes the color styling consistent with the rest of the component and uses the theme system properly.

---



---

