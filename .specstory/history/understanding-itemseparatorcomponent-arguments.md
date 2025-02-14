## SpecStory

## Understanding ItemSeparatorComponent Arguments (12/18/2024, 7:02:33 PM)

_**User**_

does ItemSeparatorComponent have arguments?

---

_**Assistant**_

Yes, `ItemSeparatorComponent` in React Native's FlatList/LegendList receives props with the following type:

```typescript
type SeparatorProps = {
  highlighted: boolean;
  leadingItem: any | null;
  trailingItem: any | null;
  section?: any;
}
```

In your code, you can update the separator component to properly type the props:

```typescript:features/conversation/conversation-messages-list.tsx
// ... existing code ...
      ItemSeparatorComponent={(props: SeparatorProps) => {
        console.log("props:", props);
        return null;
      }}
// ... existing code ...
```

The props tell you:
- `highlighted`: Whether the separator is currently highlighted
- `leadingItem`: The item above the separator
- `trailingItem`: The item below the separator
- `section`: If using sections, the section object containing the separator

Note that in your code you have two implementations - one using LegendList and one using Animated.FlatList (which appears to be commented out via the return statement). You might want to ensure you're using the correct implementation and remove the unused one.

---



---

