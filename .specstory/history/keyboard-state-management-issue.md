## SpecStory

## Keyboard State Management Issue (12/19/2024, 3:12:17 PM)

_**User**_

prlblem here is that we go in "1" but then dissmiss keyboard and it goes in "2" and set keyboardWasOpenRef.current = false; but it should stay to true!

---

_**Assistant**_

Ah, I see the issue. The problem is that dismissing the keyboard triggers a state change in `isKeyboardShown`, which causes the effect to run again and incorrectly set `keyboardWasOpenRef.current` to false. Here's how to fix it:

```typescript:features/conversation/conversation-keyboard-filler.tsx
  useEffect(() => {
    // ... existing code ...
    // Context menu is shown
    else {
      if (isKeyboardShown) {
        console.log("Keyboard was open when context menu shown");
        Keyboard.dismiss();
        lastKeyboardHeight.value = keyboardHeight.value;
        keyboardWasOpenRef.current = true;
      }
      // Remove the else branch since we want to preserve keyboardWasOpenRef.current
    }
  }, [
    messageContextMenuIsOpen,
    isKeyboardShown,
    keyboardHeight,
    lastKeyboardHeight,
  ]);
```

The key change is removing the `else` branch that was setting `keyboardWasOpenRef.current = false`. We only want to track when the keyboard was open, and once we set it to `true`, it should stay that way until the context menu is dismissed. The value will naturally be reset when the context menu is hidden and the keyboard isn't reopened.

This way, if the keyboard was open when the context menu appeared, it will reopen when the context menu is dismissed, regardless of the intermediate keyboard state changes.

---



---

