## SpecStory

## Message Status Tracking with Haptic Feedback (12/16/2024, 11:06:36 AM)

_**User**_

I want to track the previous status, and if it was sending and now it's "sent", I want to show haptic

---

_**Assistant**_

I'll help you modify the component to track the previous status and add haptic feedback when the message changes from "sending" to "sent". Here's how we can do it using `usePrevious` hook and `expo-haptics`:

```typescript
import { AnimatedHStack } from "@/design-system/HStack";
import { AnimatedText } from "@/design-system/Text";
import { translate } from "@/i18n";
import { useAppTheme } from "@/theme/useAppTheme";
import React, { memo, useEffect, useRef } from "react";
import { IConversationMessageStatus } from "../conversation-message/conversation-message.types";
import * as Haptics from 'expo-haptics';

type IConversationMessageStatusProps = {
  status: IConversationMessageStatus;
};

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

const statusMapping: Record<IConversationMessageStatus, string> = {
  sending: " ",
  sent: translate("message_status.sent"),
  error: translate("message_status.error"),
};

export const ConversationMessageStatus = memo(
  function ConversationMessageStatus({
    status,
  }: IConversationMessageStatusProps) {
    const { theme } = useAppTheme();
    const previousStatus = usePrevious(status);

    useEffect(() => {
      if (previousStatus === 'sending' && status === 'sent') {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      }
    }, [status, previousStatus]);

    return (
      <AnimatedHStack
        entering={theme.animation.reanimatedFadeInSpring}
        style={{
          overflow: "hidden",
          justifyContent: "flex-end",
        }}
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
1. Added the `usePrevious` hook to track the previous status value
2. Added `expo-haptics` for haptic feedback
3. Added an effect that triggers haptic feedback when status changes from "sending" to "sent"
4. Simplified the style object by removing the array since we only have one style object
5. Removed the commented-out `debugBorder()`

Make sure you have `expo-haptics` installed in your project. If not, you can install it with:
```bash
expo install expo-haptics
```

---



---

