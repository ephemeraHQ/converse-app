## SpecStory

## Keyboard Height Reset Logic Update (12/13/2024, 10:04:27 AM)

_**User**_

only reset when the keyboardHeightAV value came back to what it was previously

---

_**Assistant**_

I'll help modify the code to only reset the `lastKeyboardHeight` when the keyboard height returns to its previous value. Here's the updated section:

```typescript:features/conversation/conversation-keyboard-filler.tsx
// ... existing code ...

useAnimatedReaction(
  () => ({
    height: keyboardHeightAV.value,
    hasContextMenu: !!messageContextMenuData,
  }),
  (current, previous) => {
    if (current.hasContextMenu) {
      if (current.height > lastKeyboardHeight.value) {
        lastKeyboardHeight.value = current.height;
      }
    } else if (current.height === 0) {
      // Only reset when keyboard is fully closed
      lastKeyboardHeight.value = 0;
    }
  }
);

// ... existing code ...
```

The change ensures that `lastKeyboardHeight` is only reset when the keyboard is fully closed (height = 0), rather than immediately when the context menu is dismissed. This should prevent any unwanted resets during keyboard animations or partial height changes.

---



---

