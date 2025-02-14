## SpecStory

## Reanimated Height Expansion Animation (12/16/2024, 11:01:14 AM)

_**User**_

how can I have a reaniamted entering animation where the height will get animated like it will start as height 0 and expand until the actual hieght

---

_**Assistant**_

I'll help you modify the animation to include a height transition. We'll use `reanimated` layout animation for this. Here's how you can modify the component:

```typescript
import { AnimatedHStack } from "@/design-system/HStack";
import { AnimatedText } from "@/design-system/Text";
import { translate } from "@/i18n";
import { useAppTheme } from "@/theme/useAppTheme";
import { debugBorder } from "@/utils/debug-style";
import React, { memo } from "react";
import { withSpring } from "react-native-reanimated";
import { IConversationMessageStatus } from "../conversation-message/conversation-message.types";

type IConversationMessageStatusProps = {
  status: IConversationMessageStatus;
};

const statusMapping: Record<IConversationMessageStatus, string> = {
  sending: translate("message_status.sending"),
  sent: translate("message_status.sent"),
  error: translate("message_status.error"),
};

export const ConversationMessageStatus = memo(
  function ConversationMessageStatus({
    status,
  }: IConversationMessageStatusProps) {
    const { theme } = useAppTheme();

    if (status === "sending") {
      return null;
    }

    return (
      <AnimatedHStack
        entering={theme.animation.reanimatedFadeInSpring.withInitialValues({
          height: 0,
        }).withAnimation((values) => {
          'worklet';
          return {
            height: withSpring(values.height),
          };
        })}
        {...debugBorder()}
        style={[
          {
            overflow: "hidden",
            justifyContent: "flex-end",
          },
        ]}
      >
        <AnimatedText color="secondary" size="xxs">
          {statusMapping[status]}
        </AnimatedText>
      </AnimatedHStack>
    );
  }
);
```

The key changes are:
1. We use `withInitialValues` to set the initial height to 0
2. We use `withAnimation` to animate the height property using spring animation
3. The component will automatically measure its final height and animate to it

This will create a smooth expansion animation where the content starts with height 0 and expands to its full height with a spring animation, while maintaining the fade-in effect.

If you want to adjust the spring animation parameters, you could add them like this:

```typescript
withSpring(values.height, {
  damping: 15,
  stiffness: 90,
})
```

Remember that the AnimatedHStack component needs to support layout animations for this to work. If it doesn't work, you might need to wrap your component with `Animated.createAnimatedComponent()` from react-native-reanimated.

---

_**User**_

follow what here @https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/custom-animations/#custom-entering-animation 

---

_**Assistant**_

Based on the Reanimated documentation, I'll help you create a custom entering animation that animates the height from 0 to the target height. Here's how we can modify your component:

```typescript
import { AnimatedHStack } from "@/design-system/HStack";
import { AnimatedText } from "@/design-system/Text";
import { translate } from "@/i18n";
import { useAppTheme } from "@/theme/useAppTheme";
import { debugBorder } from "@/utils/debug-style";
import React, { memo } from "react";
import { withSpring } from "react-native-reanimated";
import { IConversationMessageStatus } from "../conversation-message/conversation-message.types";

type IConversationMessageStatusProps = {
  status: IConversationMessageStatus;
};

const statusMapping: Record<IConversationMessageStatus, string> = {
  sending: translate("message_status.sending"),
  sent: translate("message_status.sent"),
  error: translate("message_status.error"),
};

const customEntering = (values: { targetHeight: number }) => {
  'worklet';
  
  const animations = {
    height: withSpring(values.targetHeight, {
      damping: 15,
      stiffness: 90,
    }),
    opacity: withSpring(1)
  };
  
  const initialValues = {
    height: 0,
    opacity: 0
  };
  
  return {
    initialValues,
    animations,
  };
};

export const ConversationMessageStatus = memo(
  function ConversationMessageStatus({
    status,
  }: IConversationMessageStatusProps) {
    const { theme } = useAppTheme();

    if (status === "sending") {
      return null;
    }

    return (
      <AnimatedHStack
        entering={customEntering}
        {...debugBorder()}
        style={[
          {
            overflow: "hidden",
            justifyContent: "flex-end",
          },
        ]}
      >
        <AnimatedText color="secondary" size="xxs">
          {statusMapping[status]}
        </AnimatedText>
      </AnimatedHStack>
    );
  }
);
```

Key changes made:
1. Created a custom entering animation function that follows the Reanimated documentation pattern
2. The animation starts with height 0 and opacity 0
3. Uses `withSpring` to animate both height and opacity to their target values
4. Added spring configuration for smoother animation
5. Removed the previous animation configuration and replaced it with our custom one

This will create a smooth expansion animation where the content starts with height 0 and expands to its full height while fading in.

[Source: React Native Reanimated Custom Animations Documentation](https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/custom-animations/#custom-entering-animation)

---



---

