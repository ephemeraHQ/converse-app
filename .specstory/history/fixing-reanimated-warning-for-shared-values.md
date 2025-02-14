## SpecStory

## Fixing Reanimated Warning for Shared Values (12/13/2024, 9:55:43 AM)

_**User**_

getting this warning :Reanimated] Tried to modify key `current` of an object which has been already passed to a worklet. See 
https://docs.swmansion.com/react-native-reanimated/docs/guides/troubleshooting#tried-to-modify-key-of-an-object-which-has-been-converted-to-a-shareable 
for more details

---

_**Assistant**_

I understand the issue. The problem is that we're trying to modify a ref that's been shared with the worklet. Let's fix this by using a shared value instead of a ref, which is the recommended approach with Reanimated.

Here's how to update the hook:

```typescript:hooks/use-keyboard-is-shown-ref.ts
import {
  KeyboardState,
  useAnimatedKeyboard,
  useAnimatedReaction,
  useSharedValue,
} from "react-native-reanimated";

export function useKeyboardIsShownRef() {
  const isKeyboardShown = useSharedValue(false);

  const { state } = useAnimatedKeyboard();

  useAnimatedReaction(
    () => state.value,
    (state) => {
      if (state === KeyboardState.OPEN) {
        isKeyboardShown.value = true;
      } else if (state === KeyboardState.CLOSED) {
        isKeyboardShown.value = false;
      }
    }
  );

  return isKeyboardShown.value;
}
```

Key changes made:
1. Replaced `useRef` with Reanimated's `useSharedValue`
2. Removed the `setKeyboardShown` function and `runOnJS` since we can directly modify shared values in worklets
3. Directly update `isKeyboardShown.value` in the animated reaction

This should resolve the warning because `useSharedValue` is specifically designed to be modified within worklets, unlike refs which can cause issues when shared between the JS thread and the UI thread.

---



---

