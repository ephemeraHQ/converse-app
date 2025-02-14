## SpecStory

## Fixing Missing Icon Mapping Error (11/25/2024, 12:00:01 PM)

_**User**_

For the code present, we get this error:
```
Property '"arrow.up"' is missing in type '{ xmark: "close"; "xmark.circle.fill": "cancel"; plus: "add"; "arrow.up.right": "north-east"; "arrow.down": "arrow-downward"; link: "link"; paperplane: "send"; account_circle: "account-circle"; ... 44 more ...; star: "star"; }' but required in type 'Record<IIconName, "sort" | "map" | "filter" | "search" | "repeat" | "anchor" | "link" | "info" | "error" | "topic" | "reply" | "attachment" | "key" | "call" | "groups" | ... 2218 more ... | "zoom-out-map">'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error you're encountering indicates that the `iconRegistry` is missing a mapping for the icon name `"arrow.up"`, which is required by the `IIconName` type. To resolve this, you need to add an entry for `"arrow.up"` in the `iconRegistry`.

Here's the concise fix:

```typescript:design-system/Icon/Icon.android.tsx
export const iconRegistry: Record<
  IIconName,
  keyof typeof MaterialIcons.glyphMap
> = {
  // ... existing mappings ...
  "arrow.up": "arrow-upward", // Add this line
  // ... existing mappings ...
};
```

### Explanation:
- **Add the missing icon mapping**: The error message specifies that `"arrow.up"` is missing. By adding `"arrow.up": "arrow-upward"`, you provide the necessary mapping to a valid icon name in `MaterialIcons.glyphMap`.
- **Ensure the icon name is valid**: Make sure `"arrow-upward"` is a valid key in `MaterialIcons.glyphMap`. Adjust the value if necessary to match the correct icon name.

---



---

