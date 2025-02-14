## SpecStory

## Refactoring React Component for Animation (12/13/2024, 11:17:07 AM)

_**User**_

sepeartae into a new component the stuff with animated still, useeffect etc

---

_**Assistant**_

I'll help you separate the animation logic into a new component. Here's how we can refactor this:

1. First, let's create a new component for the animation logic:

```typescript:features/conversation/conversation-message-status/conversation-message-status-animation.tsx
import { AnimatedText } from "@/design-system/Text";
import React, { memo, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useAppTheme } from "@/theme/useAppTheme";

type IMessageStatusAnimationProps = {
  isLatestSettledFromMe: boolean;
  isSent: boolean;
  status: string;
  statusText: string | undefined;
};

export const MessageStatusAnimation = memo(function MessageStatusAnimation(
  args: IMessageStatusAnimationProps
) {
  const { isLatestSettledFromMe, isSent, status, statusText } = args;
  const { theme } = useAppTheme();

  const prevStatusRef = useRef(status);
  const [renderText, setRenderText] = useState(false);
  const opacity = useSharedValue(isLatestSettledFromMe ? 1 : 0);
  const height = useSharedValue(isLatestSettledFromMe ? 22 : 0);
  const scale = useSharedValue(isLatestSettledFromMe ? 1 : 0);

  const timingConfig = {
    duration: 200,
    easing: Easing.inOut(Easing.quad),
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    height: height.value,
    transform: [{ scale: scale.value }],
  }));

  useEffect(
    () => {
      const prevStatus = prevStatusRef.current;
      prevStatusRef.current = status;

      setTimeout(() => {
        requestAnimationFrame(() => {
          if (isSent && (prevStatus === "sending" || prevStatus === "prepared")) {
            opacity.value = withTiming(1, timingConfig);
            height.value = withTiming(22, timingConfig);
            scale.value = withTiming(1, timingConfig);
            setRenderText(true);
          } else if (isSent && !isLatestSettledFromMe) {
            opacity.value = withTiming(0, timingConfig);
            height.value = withTiming(0, timingConfig);
            scale.value = withTiming(0, timingConfig);
            setTimeout(() => setRenderText(false), timingConfig.duration);
          } else if (isLatestSettledFromMe) {
            opacity.value = 1;
            height.value = 22;
            scale.value = 1;
            setRenderText(true);
          }
        });
      }, 100);
    },
    [isLatestSettledFromMe, isSent, status]
  );

  return (
    <Animated.View
      style={[
        {
          overflow: "hidden",
        },
        animatedStyle,
      ]}
    >
      <View
        style={{
          paddingTop: theme.spacing["4xs"],
        }}
      >
        <AnimatedText color="secondary" size="xxs">
          {renderText && statusText}
        </AnimatedText>
      </View>
    </Animated.View>
  );
});
```

2. Then, let's simplify the main component:

```typescript:features/conversation/conversation-message-status/conversation-message-status.tsx
// ... existing imports ...
import { MessageStatusAnimation } from "./conversation-message-status-animation";

// ... statusMapping stays the same ...

export const ConversationMessageStatus = memo(
  function ConversationMessageStatus(args: IConversationMessageStatusProps) {
    const { message } = args;
    
    const { fromMe, isLatestSettledFromMe } = useMessageContextStoreContext(
      useSelect(["fromMe", "isLatestSettledFromMe"])
    );

    const isSent = messageIsSent(message);

    if (!isLatestSettledFromMe || !fromMe) {
      return null;
    }

    return (
      <MessageStatusAnimation
        isLatestSettledFromMe={isLatestSettledFromMe}
        isSent={isSent}
        status={message.status}
        statusText={statusMapping[message.status]}
      />
    );
  }
);
```

Key changes made:
1. Created a new `MessageStatusAnimation` component that handles all animation logic
2. Simplified the main component to only handle the business logic and data flow
3. Moved all animation-related state and effects to the new component
4. Used early returns for better readability in the main component
5. Followed the naming conventions with `I` prefix for types
6. Used object destructuring for props

The main component is now much cleaner and focused on its primary responsibility of handling the message status logic, while the animation component handles all the visual effects.

---



---

