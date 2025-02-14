## SpecStory

## Fixing Type Error in Icon Configuration (1/7/2025, 10:12:54 AM)

_**User**_

For the code present, we get this error:
```
Type '{ type: "SYSTEM"; iconValue: string; }' is not assignable to type 'IconConfig | ImageItemConfig | undefined'.
  Types of property 'type' are incompatible.
    Type '"SYSTEM"' is not assignable to type '"IMAGE_ASSET" | "IMAGE_SYSTEM" | "IMAGE_REQUIRE" | "IMAGE_EMPTY" | "IMAGE_RECT" | "IMAGE_GRADIENT" | "IMAGE_REMOTE_URL" | undefined'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error occurs because the icon type property needs to match the expected values from the library. For `react-native-ios-context-menu`, the correct type is `"IMAGE_SYSTEM"` instead of `"SYSTEM"`.

Here's the fix:
```typescript:features/conversation-list/conversation-list.screen.tsx
// ... existing code ...
              icon: {
                type: "IMAGE_SYSTEM",  // Changed from "SYSTEM"
                iconValue: "pin",
              },
// ... existing code ...
```

You'll need to make this change for all the context menu icons in the file that use `type: "SYSTEM"`.

---



---

