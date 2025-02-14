## SpecStory

## Fixing Type Error in BottomSheet Component (10/17/2024, 7:51:35 PM)

_**User**_

For the code present, we get this error:
```
Type '{ ref: MutableRefObject<BottomSheetMethods | undefined>; snapPoints: string[]; index: number; }' is not assignable to type 'IntrinsicAttributes & BottomSheetProps'.
  Property 'ref' does not exist on type 'IntrinsicAttributes & BottomSheetProps'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

To resolve this error, you need to use the `bottomSheetRef` with the `useBottomSheet` hook instead of passing it directly as a `ref` prop. Here's a concise fix:

```typescript:screens/ShareProfile.tsx
// ... existing code ...

import { BottomSheet, useBottomSheet } from "../design-system/BottomSheet/BottomSheet";

const ShareProfileContent = ({ /* ... */ }) => {
  // ... existing code ...

  const { bottomSheetRef } = useBottomSheet();

  return (
    <>
      {/* ... existing JSX ... */}
      <BottomSheet snapPoints={["50%"]} index={0} />
    </>
  );
};

// ... rest of the file ...
```

This change does the following:
1. Imports `useBottomSheet` from the BottomSheet component.
2. Replaces `useBottomSheetRef` with `useBottomSheet`.
3. Removes the `ref` prop from the `BottomSheet` component.

The `useBottomSheet` hook will handle the ref internally, resolving the type error.

---



---

