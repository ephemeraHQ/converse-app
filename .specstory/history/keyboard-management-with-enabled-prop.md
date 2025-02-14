## SpecStory

## Keyboard Management with Enabled Prop (1/2/2025, 11:30:36 AM)

_**User**_

i'm not sure about the enabled props. But what I want to say is that sometimes I want to be able to disable the keyboard close/open logic

---

_**Assistant**_

I understand you want to control when the keyboard close/open logic is active. The `enabled` prop is actually already doing this - when `enabled` is `false`, the main `useEffect` hook returns early and doesn't execute any keyboard logic.

However, let's make this more explicit and clean up the code a bit. Here are the suggested changes:

```typescript:features/conversation/conversation-keyboard-filler.tsx
type IConversationKeyboardFillerProps = {
  messageContextMenuIsOpen: boolean;
  enabled: boolean;  // Controls whether keyboard management is active
};

export const ConversationKeyboardFiller = memo(
  function ConversationKeyboardFiller(props: IConversationKeyboardFillerProps) {
    // ... existing imports and initial setup ...

    useEffect(() => {
      // Early return if keyboard management is disabled
      if (!enabled) {
        return;
      }

      if (messageContextMenuIsOpen && isKeyboardShown) {
        // Store keyboard height and dismiss when context menu opens
        lastKeyboardHeight.value = keyboardHeight.value;
        keyboardWasOpenRef.current = true;
        Keyboard.dismiss();
      } else if (!messageContextMenuIsOpen && keyboardWasOpenRef.current) {
        // Restore keyboard when context menu closes
        textInputRef.current?.focus();
        keyboardWasOpenRef.current = false;
      }
    }, [
      enabled,
      messageContextMenuIsOpen,
      isKeyboardShown,
      keyboardHeight,
      lastKeyboardHeight,
    ]);

    // ... rest of the component remains the same ...
  }
);
```

The changes:
1. Added a comment to clarify the purpose of the `enabled` prop in the type definition
2. Simplified the main `useEffect` logic with clearer conditions and comments
3. Kept the early return when `enabled` is false, which effectively disables all keyboard management

The component will now:
- When `enabled` is true: Manage keyboard state during context menu interactions
- When `enabled` is false: Do nothing with the keyboard (let other components control it)

---



---

