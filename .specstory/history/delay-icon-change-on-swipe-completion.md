## SpecStory

## Delay Icon Change on Swipe Completion (2/10/2025, 8:51:21 AM)

_**User**_

ok what i need to do here is if the isUnread value change, we need to wait until changing the icon until actionProgress value is at 0... otherwise we see the icon switch while the progress isn't finished

---

_**Assistant**_

I'll help you modify the component to delay the icon change until the swipe action is complete. We'll use the `useEffect` and `useState` hooks to manage this transition.

```typescript:features/conversation-list/conversation-list-item/conversation-list-item-swipeable/conversation-list-item-swipeable-toggle-read-action.tsx
import { ISwipeableRenderActionsArgs } from "@/components/swipeable";
import { useConversationIsUnread } from "@/features/conversation-list/hooks/use-conversation-is-unread";
import { useAppTheme } from "@/theme/useAppTheme";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import React, { memo, useState, useEffect } from "react";
import { ConversationListItemSwipeableAction } from "./conversation-list-item-swipeable-action";

export const ToggleUnreadSwipeableAction = memo(
  (props: ISwipeableRenderActionsArgs & { topic: ConversationTopic }) => {
    const { theme } = useAppTheme();
    const { isUnread } = useConversationIsUnread({
      topic: props.topic,
    });
    
    // State to track the displayed icon state
    const [displayedIsUnread, setDisplayedIsUnread] = useState(isUnread);

    useEffect(() => {
      // Only update the displayed state when the action is complete (progressAnimatedValue is 0)
      if (props.progressAnimatedValue.__getValue() === 0) {
        setDisplayedIsUnread(isUnread);
      }
    }, [isUnread, props.progressAnimatedValue]);

    return (
      <ConversationListItemSwipeableAction
        icon={displayedIsUnread ? "checkmark.message" : "message.badge"}
        color={theme.colors.fill.secondary}
        iconColor={theme.colors.global.white}
        actionProgress={props.progressAnimatedValue}
      />
    );
  }
);
```

The changes made:

1. Added `useState` and `useEffect` imports from React
2. Introduced a new state `displayedIsUnread` to control which icon is actually shown
3. Added an `useEffect` that updates the displayed icon only when the `progressAnimatedValue` is 0 (meaning the swipe action is complete)
4. Changed the icon prop to use `displayedIsUnread` instead of `isUnread`

This will ensure the icon only changes after the swipe action is complete, preventing the visual glitch during the animation.

---

_**User**_



---

_**Assistant**_

The code looks good now, but we should add a listener to the animated value to properly track when it reaches 0, rather than using `__getValue()` which is not recommended for animated values. Here's how we can improve it:

```typescript:features/conversation-list/conversation-list-item/conversation-list-item-swipeable/conversation-list-item-swipeable-toggle-read-action.tsx
import { ISwipeableRenderActionsArgs } from "@/components/swipeable";
import { useConversationIsUnread } from "@/features/conversation-list/hooks/use-conversation-is-unread";
import { useAppTheme } from "@/theme/useAppTheme";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import React, { memo, useState, useEffect } from "react";
import { ConversationListItemSwipeableAction } from "./conversation-list-item-swipeable-action";

export const ToggleUnreadSwipeableAction = memo(
  (props: ISwipeableRenderActionsArgs & { topic: ConversationTopic }) => {
    const { theme } = useAppTheme();
    const { isUnread } = useConversationIsUnread({
      topic: props.topic,
    });
    
    // State to track the displayed icon state
    const [displayedIsUnread, setDisplayedIsUnread] = useState(isUnread);

    useEffect(() => {
      // Add listener to the animated value
      const id = props.progressAnimatedValue.addListener(({ value }) => {
        if (value === 0) {
          setDisplayedIsUnread(isUnread);
        }
      });

      // Cleanup listener on unmount
      return () => {
        props.progressAnimatedValue.removeListener(id);
      };
    }, [isUnread, props.progressAnimatedValue]);

    return (
      <ConversationListItemSwipeableAction
        icon={displayedIsUnread ? "checkmark.message" : "message.badge"}
        color={theme.colors.fill.secondary}
        iconColor={theme.colors.global.white}
        actionProgress={props.progressAnimatedValue}
      />
    );
  }
);
```

The changes made:
1. Replaced `__getValue()` with a proper animated value listener
2. Added cleanup function to remove the listener when the component unmounts
3. The icon will now update smoothly when the animation completes (value reaches 0)

This approach is more reliable and follows React Native's animation best practices.

---

_**User**_

use react-native-animated stuff luke useAnimatedReaction or useDerivedValue for example

---

_**Assistant**_

Ah yes, let's use React Native Reanimated's hooks for better performance and type safety. We'll use `useAnimatedReaction` to watch the progress value.

```typescript:features/conversation-list/conversation-list-item/conversation-list-item-swipeable/conversation-list-item-swipeable-toggle-read-action.tsx
import { ISwipeableRenderActionsArgs } from "@/components/swipeable";
import { useConversationIsUnread } from "@/features/conversation-list/hooks/use-conversation-is-unread";
import { useAppTheme } from "@/theme/useAppTheme";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import React, { memo, useState } from "react";
import { useAnimatedReaction } from "react-native-reanimated";
import { ConversationListItemSwipeableAction } from "./conversation-list-item-swipeable-action";

export const ToggleUnreadSwipeableAction = memo(
  (props: ISwipeableRenderActionsArgs & { topic: ConversationTopic }) => {
    const { theme } = useAppTheme();
    const { isUnread } = useConversationIsUnread({
      topic: props.topic,
    });
    
    // State to track the displayed icon state
    const [displayedIsUnread, setDisplayedIsUnread] = useState(isUnread);

    useAnimatedReaction(
      () => props.progressAnimatedValue.value,
      (currentValue, previousValue) => {
        if (currentValue === 0 && previousValue !== 0) {
          setDisplayedIsUnread(isUnread);
        }
      },
      [isUnread]
    );

    return (
      <ConversationListItemSwipeableAction
        icon={displayedIsUnread ? "checkmark.message" : "message.badge"}
        color={theme.colors.fill.secondary}
        iconColor={theme.colors.global.white}
        actionProgress={props.progressAnimatedValue}
      />
    );
  }
);
```

The changes made:
1. Removed `useEffect` in favor of `useAnimatedReaction`
2. Added `useAnimatedReaction` to watch the progress value changes
3. Only update the displayed state when the progress value reaches 0 and was previously not 0
4. The icon will now update smoothly using Reanimated's native driver

This approach is more performant as it runs on the native thread and is type-safe with Reanimated's API.

---

_**User**_

it should be more like displayICon and then depeninfg on isUnread show the right one. But I just want to make sure to not switch the icon until progress is <0.1

---

_**Assistant**_

I'll help refactor this to make it clearer with a derived icon value based on the progress and isUnread state.

```typescript:features/conversation-list/conversation-list-item/conversation-list-item-swipeable/conversation-list-item-swipeable-toggle-read-action.tsx
import { ISwipeableRenderActionsArgs } from "@/components/swipeable";
import { useConversationIsUnread } from "@/features/conversation-list/hooks/use-conversation-is-unread";
import { useAppTheme } from "@/theme/useAppTheme";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import React, { memo } from "react";
import { useDerivedValue } from "react-native-reanimated";
import { ConversationListItemSwipeableAction } from "./conversation-list-item-swipeable-action";

export const ToggleUnreadSwipeableAction = memo(
  (props: ISwipeableRenderActionsArgs & { topic: ConversationTopic }) => {
    const { progressAnimatedValue, topic } = props;
    const { theme } = useAppTheme();
    const { isUnread } = useConversationIsUnread({ topic });

    // Derive the icon based on progress value and isUnread state
    const displayIcon = useDerivedValue(() => {
      const isAnimating = progressAnimatedValue.value >= 0.1;
      // If still animating, keep current icon state
      if (isAnimating) {
        return displayIcon.value;
      }
      // Otherwise update to new icon based on isUnread
      return isUnread ? "checkmark.message" : "message.badge";
    }, [isUnread]);

    return (
      <ConversationListItemSwipeableAction
        icon={displayIcon.value}
        color={theme.colors.fill.secondary}
        iconColor={theme.colors.global.white}
        actionProgress={progressAnimatedValue}
      />
    );
  }
);
```

Key changes:
1. Removed the useState and useAnimatedReaction in favor of a single useDerivedValue
2. The icon is now derived directly from the progress value and isUnread state
3. Only updates the icon when progress is < 0.1
4. Maintains the current icon state while animating (progress >= 0.1)
5. Removed console.log statements
6. Simplified the overall logic

This should give you the same behavior but with cleaner, more declarative code.

---

_**User**_



---

_**Assistant**_

The current implementation has a potential issue with circular dependency in the `useDerivedValue` hook - we're referencing `displayIcon.value` within its own calculation. Let's fix this by using a shared value to store the current icon state:

```typescript:features/conversation-list/conversation-list-item/conversation-list-item-swipeable/conversation-list-item-swipeable-toggle-read-action.tsx
import { ISwipeableRenderActionsArgs } from "@/components/swipeable";
import { useConversationIsUnread } from "@/features/conversation-list/hooks/use-conversation-is-unread";
import { useAppTheme } from "@/theme/useAppTheme";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import React, { memo } from "react";
import { useDerivedValue, useSharedValue } from "react-native-reanimated";
import { ConversationListItemSwipeableAction } from "./conversation-list-item-swipeable-action";

type IconType = "checkmark.message" | "message.badge";

export const ToggleUnreadSwipeableAction = memo(
  (props: ISwipeableRenderActionsArgs & { topic: ConversationTopic }) => {
    const { progressAnimatedValue, topic } = props;
    const { theme } = useAppTheme();
    const { isUnread } = useConversationIsUnread({ topic });

    // Initialize with current unread state
    const currentIcon = useSharedValue<IconType>(
      isUnread ? "checkmark.message" : "message.badge"
    );

    const displayIcon = useDerivedValue(() => {
      const isAnimating = progressAnimatedValue.value >= 0.1;
      if (!isAnimating) {
        // Update the current icon when not animating
        currentIcon.value = isUnread ? "checkmark.message" : "message.badge";
      }
      return currentIcon.value;
    }, [isUnread]);

    return (
      <ConversationListItemSwipeableAction
        icon={displayIcon.value}
        color={theme.colors.fill.secondary}
        iconColor={theme.colors.global.white}
        actionProgress={progressAnimatedValue}
      />
    );
  }
);
```

Key changes:
1. Added `useSharedValue` to properly store the current icon state
2. Defined a type for the icon values to improve type safety
3. Fixed the circular dependency issue by using a separate shared value
4. The logic remains the same - only update icon when progress is < 0.1
5. Simplified the conditional logic

This should work more reliably while maintaining the same behavior.

---

_**User**_

we can't use displayIcon as an animated value that's why i suggested animatedReaction and useSatte

---

_**Assistant**_

Ah yes, you're right - we need to use `useAnimatedReaction` with `useState` since we're updating a React state from an animated value. Here's the corrected version:

```typescript:features/conversation-list/conversation-list-item/conversation-list-item-swipeable/conversation-list-item-swipeable-toggle-read-action.tsx
import { ISwipeableRenderActionsArgs } from "@/components/swipeable";
import { useConversationIsUnread } from "@/features/conversation-list/hooks/use-conversation-is-unread";
import { useAppTheme } from "@/theme/useAppTheme";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import React, { memo, useState } from "react";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";
import { ConversationListItemSwipeableAction } from "./conversation-list-item-swipeable-action";

type IconType = "checkmark.message" | "message.badge";

export const ToggleUnreadSwipeableAction = memo(
  (props: ISwipeableRenderActionsArgs & { topic: ConversationTopic }) => {
    const { progressAnimatedValue, topic } = props;
    const { theme } = useAppTheme();
    const { isUnread } = useConversationIsUnread({ topic });

    const [displayIcon, setDisplayIcon] = useState<IconType>(
      isUnread ? "checkmark.message" : "message.badge"
    );

    useAnimatedReaction(
      () => progressAnimatedValue.value,
      (currentValue) => {
        if (currentValue < 0.1) {
          runOnJS(setDisplayIcon)(
            isUnread ? "checkmark.message" : "message.badge"
          );
        }
      },
      [isUnread]
    );

    return (
      <ConversationListItemSwipeableAction
        icon={displayIcon}
        color={theme.colors.fill.secondary}
        iconColor={theme.colors.global.white}
        actionProgress={progressAnimatedValue}
      />
    );
  }
);
```

Key changes:
1. Switched back to using `useState` for the icon state
2. Using `useAnimatedReaction` to watch the progress value
3. Using `runOnJS` to update the React state from the animated worklet
4. The icon will only update when the progress value is less than 0.1
5. Added type safety with the `IconType` type

This should work correctly now, updating the icon only when the swipe animation is nearly complete.

---

_**User**_

ok this current version works. Put small comments to explain why we're doing this little hack

---

_**Assistant**_

I'll add comments to explain the animation timing hack:

```typescript:features/conversation-list/conversation-list-item/conversation-list-item-swipeable/conversation-list-item-swipeable-toggle-read-action.tsx
import { ISwipeableRenderActionsArgs } from "@/components/swipeable";
import { useConversationIsUnread } from "@/features/conversation-list/hooks/use-conversation-is-unread";
import { useAppTheme } from "@/theme/useAppTheme";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import React, { memo, useState } from "react";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";
import { ConversationListItemSwipeableAction } from "./conversation-list-item-swipeable-action";

type IconType = "checkmark.message" | "message.badge";

export const ToggleUnreadSwipeableAction = memo(
  (props: ISwipeableRenderActionsArgs & { topic: ConversationTopic }) => {
    const { progressAnimatedValue, topic } = props;
    const { theme } = useAppTheme();
    const { isUnread } = useConversationIsUnread({ topic });

    // Track which icon to display based on unread state
    const [displayIcon, setDisplayIcon] = useState<IconType>(
      isUnread ? "checkmark.message" : "message.badge"
    );

    // Only update the icon when the swipe animation is almost complete (progress < 0.1)
    // This prevents the icon from changing while the swipe action is still visible
    useAnimatedReaction(
      () => progressAnimatedValue.value,
      (currentValue) => {
        if (currentValue < 0.1) {
          runOnJS(setDisplayIcon)(
            isUnread ? "checkmark.message" : "message.badge"
          );
        }
      },
      [isUnread]
    );

    return (
      <ConversationListItemSwipeableAction
        icon={displayIcon}
        color={theme.colors.fill.secondary}
        iconColor={theme.colors.global.white}
        actionProgress={progressAnimatedValue}
      />
    );
  }
);
```

The comments explain that we're intentionally delaying the icon update until the swipe animation is nearly complete to prevent visual glitches during the swipe action.

---



---

