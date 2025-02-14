## SpecStory

## Keyboard Dismissal Issue in Context Menu (1/2/2025, 10:15:18 AM)

_**User**_

Problem I have here. So when I open the context menu and i press on something to open a new window that needs the keyboard to be open, it detects open here and close it but it should keep it open since we. are in antoher window... 

---

_**Assistant**_

I understand the issue. The problem is that the keyboard management logic is too aggressive in dismissing the keyboard when the context menu opens, without considering if we're navigating to a new screen that needs the keyboard.

Here's how we can modify the code to fix this:

```typescript:features/conversation/conversation-keyboard-filler.tsx
// ... existing imports ...

export const ConversationKeyboardFiller = memo(
  function ConversationKeyboardFiller(props: IConversationKeyboardFillerProps) {
    // ... existing declarations ...

    useEffect(() => {
      if (messageContextMenuIsOpen) {
        // Only dismiss keyboard if we're staying on the same screen
        // We'll use a small delay to allow for navigation to occur first
        const timeoutId = setTimeout(() => {
          if (isKeyboardShown && messageContextMenuIsOpen) {
            Keyboard.dismiss();
            lastKeyboardHeight.value = keyboardHeight.value;
            keyboardWasOpenRef.current = true;
          }
        }, 100);

        return () => clearTimeout(timeoutId);
      } else {
        // Existing logic for when context menu is hidden
        if (keyboardWasOpenRef.current) {
          textInputRef.current?.focus();
          keyboardWasOpenRef.current = false;
        }
      }
    }, [messageContextMenuIsOpen, isKeyboardShown, keyboardHeight, lastKeyboardHeight]);

    // ... rest of the component remains the same ...
```

The key changes are:
1. Added a small delay (100ms) before dismissing the keyboard when the context menu opens
2. The delay allows time for navigation to occur, and if we've navigated away, the component will unmount and the keyboard dismissal won't happen
3. We also check if the context menu is still open when the timeout fires, preventing any race conditions

This should prevent the keyboard from being dismissed when you're navigating to a new screen that needs the keyboard. The keyboard will only be dismissed if you're staying on the same screen with the context menu open.

---



---

