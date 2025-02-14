## SpecStory

## Maintaining Keyboard Height with Context Menu (12/13/2024, 9:38:32 AM)

_**User**_

Ok what I wnat to do here. Help me. I have this filler block that will help with my conversation chat. But i also want that if "messageContextMenuData" has data to put the hiehgt of the filler to the previous saved keyboard height. Because when I open a context menu on a message, i dissmiss the keyboard but I want to keep the chat at the same position so i need to keep the keyboard filler

---

_**Assistant**_

I'll help you modify the KeyboardFiller component to maintain the height when the context menu is open. We'll need to store the last keyboard height and use it when the context menu is open.

```typescript
import { memo } from "react";
import { AnimatedVStack } from "@design-system/VStack";
import { useAnimatedKeyboard, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMessageContextMenuStoreContext } from "@/features/conversation/conversation-message/conversation-message-context-menu/conversation-message-context-menu.store-context";
import { useSharedValue } from "react-native-reanimated";
import { useEffect } from "react";

export const KeyboardFiller = memo(function KeyboardFiller() {
  const { height: keyboardHeightAV } = useAnimatedKeyboard();
  const insets = useSafeAreaInsets();
  const lastKeyboardHeight = useSharedValue(0);

  const messageContextMenuData = useMessageContextMenuStoreContext(
    (state) => state.messageContextMenuData
  );

  // Store the last keyboard height when keyboard is visible
  useEffect(() => {
    if (keyboardHeightAV.value > 0) {
      lastKeyboardHeight.value = keyboardHeightAV.value;
    }
  }, [keyboardHeightAV.value]);

  const as = useAnimatedStyle(() => {
    const heightToUse = messageContextMenuData 
      ? lastKeyboardHeight.value 
      : keyboardHeightAV.value;

    return {
      height: withSpring(Math.max(heightToUse - insets.bottom, 0)),
    };
  });

  return <AnimatedVStack style={as} />;
});
```

Key changes made:
1. Added `useSharedValue` to store the last keyboard height
2. Added an effect to update the last keyboard height when keyboard is visible
3. Modified the animated style to use either the last keyboard height (when context menu is open) or the current keyboard height
4. Added `withSpring` for smooth animation between states

This way, when you open the context menu and the keyboard dismisses, the filler will maintain its previous height, keeping the chat position stable. When the context menu closes, it will go back to following the actual keyboard height.

---

_**User**_

maybe use useAnimatedReaction instead of useEffect?

---

_**Assistant**_

Yes, that's a better approach! `useAnimatedReaction` is more suitable for this case since we're working with animated values. Here's the improved version:

```typescript:features/conversation/conversation-keyboard-filler.tsx
import { memo } from "react";
import { AnimatedVStack } from "@design-system/VStack";
import { 
  useAnimatedKeyboard, 
  useAnimatedStyle, 
  withSpring,
  useAnimatedReaction 
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMessageContextMenuStoreContext } from "@/features/conversation/conversation-message/conversation-message-context-menu/conversation-message-context-menu.store-context";
import { useSharedValue } from "react-native-reanimated";

export const KeyboardFiller = memo(function KeyboardFiller() {
  const { height: keyboardHeightAV } = useAnimatedKeyboard();
  const insets = useSafeAreaInsets();
  const lastKeyboardHeight = useSharedValue(0);

  const messageContextMenuData = useMessageContextMenuStoreContext(
    (state) => state.messageContextMenuData
  );

  useAnimatedReaction(
    () => keyboardHeightAV.value,
    (currentHeight) => {
      if (currentHeight > 0) {
        lastKeyboardHeight.value = currentHeight;
      }
    }
  );

  const as = useAnimatedStyle(() => {
    const heightToUse = messageContextMenuData 
      ? lastKeyboardHeight.value 
      : keyboardHeightAV.value;

    return {
      height: withSpring(Math.max(heightToUse - insets.bottom, 0)),
    };
  });

  return <AnimatedVStack style={as} />;
});
```

This version is more performant as `useAnimatedReaction` runs on the UI thread and is specifically designed for handling animated values. It will react to changes in the keyboard height and update the `lastKeyboardHeight` shared value accordingly.

---

_**User**_

dpesn't work because when we dissmiss the keyboard, keyboardHeightAV.value will change going to 0 and so "lastKeyboardHeight.value" will go to 0 at some point, I need to last max keyboard value 

---

_**Assistant**_

Ah, you're right! We need to store the maximum keyboard height and only update it when we get a larger value. Here's the corrected version:

```typescript:features/conversation/conversation-keyboard-filler.tsx
import { memo } from "react";
import { AnimatedVStack } from "@design-system/VStack";
import { 
  useAnimatedKeyboard, 
  useAnimatedStyle, 
  withSpring,
  useAnimatedReaction 
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMessageContextMenuStoreContext } from "@/features/conversation/conversation-message/conversation-message-context-menu/conversation-message-context-menu.store-context";
import { useSharedValue } from "react-native-reanimated";

export const KeyboardFiller = memo(function KeyboardFiller() {
  const { height: keyboardHeightAV } = useAnimatedKeyboard();
  const insets = useSafeAreaInsets();
  const lastKeyboardHeight = useSharedValue(0);

  const messageContextMenuData = useMessageContextMenuStoreContext(
    (state) => state.messageContextMenuData
  );

  useAnimatedReaction(
    () => keyboardHeightAV.value,
    (currentHeight) => {
      // Only update if we find a larger height
      if (currentHeight > lastKeyboardHeight.value) {
        lastKeyboardHeight.value = currentHeight;
      }
    }
  );

  const as = useAnimatedStyle(() => {
    const heightToUse = messageContextMenuData 
      ? lastKeyboardHeight.value 
      : keyboardHeightAV.value;

    return {
      height: withSpring(Math.max(heightToUse - insets.bottom, 0)),
    };
  });

  return <AnimatedVStack style={as} />;
});
```

The key change is in the `useAnimatedReaction` where we now only update `lastKeyboardHeight.value` if the current height is larger than the stored value. This way, when the keyboard dismisses, we'll keep the maximum height we've seen.

---

_**User**_

and then more thing. Frist remvoe the withSpring. Also problem is leT's say i open context menu on message but the keyboard is already dismseesd so "keyboardHeightAV.value" is at 0, we don't want to animate to "lastKeyboardHeight.value"... the keyboard WAS closed already... So only keep the lastKeyboardHeight value if "messageContextMenuData" has a value otherwise we can put "lastKeyboardHeight.value" to 0

---

_**Assistant**_



Ah yes, that makes perfect sense! We'll only maintain the last keyboard height when the context menu is active, otherwise we can reset it. Here's the updated version:

```typescript:features/conversation/conversation-keyboard-filler.tsx
export const KeyboardFiller = memo(function KeyboardFiller() {
  const { height: keyboardHeightAV } = useAnimatedKeyboard();
  const insets = useSafeAreaInsets();
  const lastKeyboardHeight = useSharedValue(0);

  const messageContextMenuData = useMessageContextMenuStoreContext(
    (state) => state.messageContextMenuData
  );

  useAnimatedReaction(
    () => ({ height: keyboardHeightAV.value, hasContextMenu: !!messageContextMenuData }),
    (current, previous) => {
      if (current.hasContextMenu) {
        // Only update if we find a larger height when context menu is active
        if (current.height > lastKeyboardHeight.value) {
          lastKeyboardHeight.value = current.height;
        }
      } else {
        // Reset the last height when context menu is dismissed
        lastKeyboardHeight.value = 0;
      }
    }
  );

  const as = useAnimatedStyle(() => {
    const heightToUse = messageContextMenuData 
      ? lastKeyboardHeight.value 
      : keyboardHeightAV.value;

    return {
      height: Math.max(heightToUse - insets.bottom, 0),
    };
  });

  return <AnimatedVStack style={as} />;
});
```

Key changes:
1. Removed `withSpring` for immediate height changes
2. Modified `useAnimatedReaction` to track both keyboard height and context menu state
3. Reset `lastKeyboardHeight` to 0 when context menu is dismissed
4. Only store keyboard height when context menu is active

This way, we'll only maintain the keyboard height when it's relevant (during context menu), and we won't animate to a previous height if the keyboard was already dismissed.

---

_**User**_

we also need to make sure that if we open message context menu, to dissmiss the keyboard and once messageContextMenuData is null again, we put the keyboard back in,

---

_**Assistant**_

We'll need to control the keyboard visibility based on the context menu state. Here's how we can do that:

```typescript:features/conversation/conversation-keyboard-filler.tsx
import { memo, useEffect } from "react";
import { AnimatedVStack } from "@design-system/VStack";
import { 
  useAnimatedKeyboard, 
  useAnimatedStyle, 
  useAnimatedReaction 
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMessageContextMenuStoreContext } from "@/features/conversation/conversation-message/conversation-message-context-menu/conversation-message-context-menu.store-context";
import { useSharedValue } from "react-native-reanimated";
import { Keyboard } from "react-native";

export const KeyboardFiller = memo(function KeyboardFiller() {
  const { height: keyboardHeightAV } = useAnimatedKeyboard();
  const insets = useSafeAreaInsets();
  const lastKeyboardHeight = useSharedValue(0);

  const messageContextMenuData = useMessageContextMenuStoreContext(
    (state) => state.messageContextMenuData
  );

  useEffect(() => {
    if (messageContextMenuData) {
      Keyboard.dismiss();
    }
  }, [messageContextMenuData]);

  useAnimatedReaction(
    () => ({ height: keyboardHeightAV.value, hasContextMenu: !!messageContextMenuData }),
    (current, previous) => {
      if (current.hasContextMenu) {
        if (current.height > lastKeyboardHeight.value) {
          lastKeyboardHeight.value = current.height;
        }
      } else {
        lastKeyboardHeight.value = 0;
      }
    }
  );

  const as = useAnimatedStyle(() => {
    const heightToUse = messageContextMenuData 
      ? lastKeyboardHeight.value 
      : keyboardHeightAV.value;

    return {
      height: Math.max(heightToUse - insets.bottom, 0),
    };
  });

  return <AnimatedVStack style={as} />;
});
```

The key addition is the `useEffect` that dismisses the keyboard when the context menu opens. For showing the keyboard again, you'll need to handle that in your input component when the context menu closes. This is because we can't programmatically show the keyboard without focusing an input element.

You should handle the keyboard show in your input component when `messageContextMenuData` becomes null, using something like `inputRef.current?.focus()`.

---

_**User**_

how can I open the keyboard in react-native

---

_**Assistant**_

In React Native, you can't directly "open" the keyboard - it can only be shown by focusing an input element. Here are the two main approaches:

```typescript
// Method 1: Using a ref
const inputRef = useRef<TextInput>(null);

// To show keyboard
inputRef.current?.focus();

// Method 2: Using the focus() method on TextInput
<TextInput 
  ref={inputRef}
  // ... other props
/>
```

For your specific case, you'll need to handle this in the component that contains your TextInput. You could create a ref to your input and focus it when the context menu closes:

```typescript
const ChatInput = memo(function ChatInput() {
  const inputRef = useRef<TextInput>(null);
  
  const messageContextMenuData = useMessageContextMenuStoreContext(
    (state) => state.messageContextMenuData
  );

  useEffect(() => {
    if (!messageContextMenuData) {
      // When context menu closes, focus the input
      inputRef.current?.focus();
    }
  }, [messageContextMenuData]);

  return (
    <TextInput 
      ref={inputRef}
      // ... other props
    />
  );
});
```

Remember that this will only work if the TextInput is mounted and visible in the UI. Also, some devices or OS versions might have different behaviors with programmatic focus.

---

_**User**_

we can only do it with focus??

---

_**Assistant**_



Actually, there is another way using the Keyboard API in React Native! Here are all the methods available:

```typescript
import { Keyboard } from 'react-native';

// Dismiss keyboard
Keyboard.dismiss();

// Show keyboard
Keyboard.scheduleLayoutAnimation(); // This triggers the keyboard to show up

// Other useful methods
Keyboard.addListener('keyboardDidShow', () => {});
Keyboard.addListener('keyboardDidHide', () => {});
```

However, `Keyboard.scheduleLayoutAnimation()` alone won't show the keyboard - you still need a focused input. The keyboard in mobile is inherently tied to input elements for security and UX reasons.

So unfortunately, yes - focusing an input is still the most reliable way to show the keyboard. This is by design in both iOS and Android to prevent apps from arbitrarily showing the keyboard without user interaction or a clear input context.

---



---

