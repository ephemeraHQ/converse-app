## SpecStory

## Unifying Conversation Message Components (12/12/2024, 3:45:08 PM)

_**User**_

possible to unify this component and @conversation-message-timestamp.tsx ?

---

_**Assistant**_

Yes, we can unify these components since they share similar logic for displaying message timestamps. I'll create a unified component that handles both cases. Here's how we can combine them:

```typescript:features/conversation/conversation-message-time.tsx
import { useMessageContextStore, useMessageContextStoreContext } from "@/features/conversation/conversation-message.store-context";
import { AnimatedHStack } from "@design-system/HStack";
import { AnimatedText, Text } from "@design-system/Text";
import { getTextStyle } from "@design-system/Text/Text.utils";
import { AnimatedVStack } from "@design-system/VStack";
import { SICK_DAMPING, SICK_STIFFNESS } from "@theme/animations";
import { useAppTheme } from "@theme/useAppTheme";
import { getLocalizedTime, getRelativeDate } from "@utils/date";
import { flattenStyles } from "@utils/styles";
import { memo, useEffect } from "react";
import {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

type IMessageTimeProps = {
  variant: "inline" | "standalone";
};

export const ConversationMessageTime = memo(function ConversationMessageTime({
  variant,
}: IMessageTimeProps) {
  const { theme, themed } = useAppTheme();
  const [sentAt, showDateChange] = useMessageContextStoreContext((s) => [
    s.sentAt,
    s.showDateChange,
  ]);

  const showTimeAV = useSharedValue(0);
  const messageStore = useMessageContextStore();

  useEffect(() => {
    const unsubscribe = messageStore.subscribe(
      (state) => state.isShowingTime,
      (isShowingTime) => {
        showTimeAV.value = isShowingTime ? 1 : 0;
      }
    );
    return () => unsubscribe();
  }, [messageStore, showTimeAV]);

  const messageTime = sentAt ? getLocalizedTime(sentAt) : "";

  if (variant === "inline") {
    if (!showDateChange) {
      return null;
    }

    const timeInlineAnimatedStyle = useAnimatedStyle(() => ({
      display: showTimeAV.value ? "flex" : "none",
      opacity: withSpring(showTimeAV.value ? 1 : 0, {
        damping: SICK_DAMPING,
        stiffness: SICK_STIFFNESS,
      }),
    }));

    const messageDate = getRelativeDate(sentAt);

    return (
      <AnimatedHStack
        layout={theme.animation.reanimatedLayoutSpringTransition}
        style={{
          alignSelf: "center",
          alignItems: "center",
          justifyContent: "center",
          columnGap: theme.spacing["4xs"],
          marginVertical: theme.spacing.sm,
        }}
      >
        <Text preset="smaller" color="secondary">
          {messageDate}
        </Text>
        <AnimatedText
          preset="smaller"
          color="secondary"
          style={timeInlineAnimatedStyle}
        >
          {messageTime}
        </AnimatedText>
      </AnimatedHStack>
    );
  }

  // Standalone variant
  if (showDateChange) {
    return null;
  }

  const textHeight = flattenStyles(
    getTextStyle(themed, { preset: "smaller" })
  ).lineHeight;

  const showTimeProgressAV = useDerivedValue(() => {
    return withSpring(showTimeAV.value ? 1 : 0, {
      damping: SICK_DAMPING,
      stiffness: SICK_STIFFNESS,
    });
  });

  const timeAnimatedStyle = useAnimatedStyle(() => ({
    height: interpolate(showTimeProgressAV.value, [0, 1], [0, textHeight || 14]),
    opacity: interpolate(showTimeProgressAV.value, [0, 1], [0, 1]),
    marginVertical: interpolate(
      showTimeProgressAV.value,
      [0, 1],
      [0, theme.spacing.sm]
    ),
    transform: [
      { scale: showTimeProgressAV.value },
      {
        translateY: interpolate(
          showTimeProgressAV.value,
          [0, 1],
          [theme.spacing.xl, 0]
        ),
      },
    ],
  }), [textHeight]);

  return (
    <AnimatedVStack
      style={[
        {
          alignItems: "center",
          overflow: "hidden",
          width: "100%",
        },
        timeAnimatedStyle,
      ]}
    >
      <Text preset="smaller" color="secondary">
        {messageTime}
      </Text>
    </AnimatedVStack>
  );
});
```

The key changes made:

1. Created a unified component that accepts a `variant` prop to determine the display mode
2. Combined the shared logic (store subscription, time formatting)
3. Used conditional rendering based on the variant prop
4. Maintained the same animations and styling for both variants

To use this component, you would replace both previous components with:

```typescript
// For inline usage (previously ConversationMessageDateChange)
<ConversationMessageTime variant="inline" />

// For standalone usage (previously ConversationMessageTimestamp)
<ConversationMessageTime variant="standalone" />
```

This refactoring reduces code duplication while maintaining the same functionality and animations. The component now handles both use cases through a single, more maintainable implementation.

---

_**User**_

so basically if showDateChange is true, it means we show like "Today" so if we show the time it will be inline, if showDateChange is false than we show it standalone with a different animation like you saw. So no need the prop variant

---

_**Assistant**_

Ah, you're right! The `showDateChange` state already determines which variant to show, so we can simplify the component further. Here's the cleaned up version:

```typescript:features/conversation/conversation-message-time.tsx
import { useMessageContextStore, useMessageContextStoreContext } from "@/features/conversation/conversation-message.store-context";
import { AnimatedHStack } from "@design-system/HStack";
import { AnimatedText, Text } from "@design-system/Text";
import { getTextStyle } from "@design-system/Text/Text.utils";
import { AnimatedVStack } from "@design-system/VStack";
import { SICK_DAMPING, SICK_STIFFNESS } from "@theme/animations";
import { useAppTheme } from "@theme/useAppTheme";
import { getLocalizedTime, getRelativeDate } from "@utils/date";
import { flattenStyles } from "@utils/styles";
import { memo, useEffect } from "react";
import {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

export const ConversationMessageTime = memo(function ConversationMessageTime() {
  const { theme, themed } = useAppTheme();
  const [sentAt, showDateChange] = useMessageContextStoreContext((s) => [
    s.sentAt,
    s.showDateChange,
  ]);

  const showTimeAV = useSharedValue(0);
  const messageStore = useMessageContextStore();

  useEffect(() => {
    const unsubscribe = messageStore.subscribe(
      (state) => state.isShowingTime,
      (isShowingTime) => {
        showTimeAV.value = isShowingTime ? 1 : 0;
      }
    );
    return () => unsubscribe();
  }, [messageStore, showTimeAV]);

  const messageTime = sentAt ? getLocalizedTime(sentAt) : "";

  if (showDateChange) {
    const timeInlineAnimatedStyle = useAnimatedStyle(() => ({
      display: showTimeAV.value ? "flex" : "none",
      opacity: withSpring(showTimeAV.value ? 1 : 0, {
        damping: SICK_DAMPING,
        stiffness: SICK_STIFFNESS,
      }),
    }));

    const messageDate = getRelativeDate(sentAt);

    return (
      <AnimatedHStack
        layout={theme.animation.reanimatedLayoutSpringTransition}
        style={{
          alignSelf: "center",
          alignItems: "center",
          justifyContent: "center",
          columnGap: theme.spacing["4xs"],
          marginVertical: theme.spacing.sm,
        }}
      >
        <Text preset="smaller" color="secondary">
          {messageDate}
        </Text>
        <AnimatedText
          preset="smaller"
          color="secondary"
          style={timeInlineAnimatedStyle}
        >
          {messageTime}
        </AnimatedText>
      </AnimatedHStack>
    );
  }

  const textHeight = flattenStyles(
    getTextStyle(themed, { preset: "smaller" })
  ).lineHeight;

  const showTimeProgressAV = useDerivedValue(() => {
    return withSpring(showTimeAV.value ? 1 : 0, {
      damping: SICK_DAMPING,
      stiffness: SICK_STIFFNESS,
    });
  });

  const timeAnimatedStyle = useAnimatedStyle(() => ({
    height: interpolate(showTimeProgressAV.value, [0, 1], [0, textHeight || 14]),
    opacity: interpolate(showTimeProgressAV.value, [0, 1], [0, 1]),
    marginVertical: interpolate(
      showTimeProgressAV.value,
      [0, 1],
      [0, theme.spacing.sm]
    ),
    transform: [
      { scale: showTimeProgressAV.value },
      {
        translateY: interpolate(
          showTimeProgressAV.value,
          [0, 1],
          [theme.spacing.xl, 0]
        ),
      },
    ],
  }), [textHeight]);

  return (
    <AnimatedVStack
      style={[
        {
          alignItems: "center",
          overflow: "hidden",
          width: "100%",
        },
        timeAnimatedStyle,
      ]}
    >
      <Text preset="smaller" color="secondary">
        {messageTime}
      </Text>
    </AnimatedVStack>
  );
});
```features/conversation/conversation-message-date-change.tsx

Now the component simply uses `showDateChange` to determine whether to show the inline version (with date + time) or the standalone version (time only with different animation). You can use it simply as:

```typescript
<ConversationMessageTime />
```

The logic is cleaner now since we're using the existing state to determine the display mode rather than requiring an external prop. Thanks for the clarification!

---

_**User**_

For the code present, we get this error:
```
React Hook "useAnimatedStyle" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

Ah yes - we need to define all hooks at the top of the component before any conditional returns. Here's the fix:

```typescript:features/conversation/conversation-message-time.tsx
export const ConversationMessageTime = memo(function ConversationMessageTime() {
  // ... existing initial hooks ...

  const textHeight = flattenStyles(
    getTextStyle(themed, { preset: "smaller" })
  ).lineHeight;

  const showTimeProgressAV = useDerivedValue(() => {
    return withSpring(showTimeAV.value ? 1 : 0, {
      damping: SICK_DAMPING,
      stiffness: SICK_STIFFNESS,
    });
  });

  const timeStandaloneStyle = useAnimatedStyle(() => ({
    height: interpolate(showTimeProgressAV.value, [0, 1], [0, textHeight || 14]),
    opacity: interpolate(showTimeProgressAV.value, [0, 1], [0, 1]),
    marginVertical: interpolate(showTimeProgressAV.value, [0, 1], [0, theme.spacing.sm]),
    transform: [
      { scale: showTimeProgressAV.value },
      { translateY: interpolate(showTimeProgressAV.value, [0, 1], [theme.spacing.xl, 0]) },
    ],
  }), [textHeight]);

  const timeInlineStyle = useAnimatedStyle(() => ({
    display: showTimeAV.value ? "flex" : "none",
    opacity: withSpring(showTimeAV.value ? 1 : 0, {
      damping: SICK_DAMPING,
      stiffness: SICK_STIFFNESS,
    }),
  }));

  // Rest of the component with conditional returns using timeStandaloneStyle and timeInlineStyle
  if (showDateChange) {
    // Use timeInlineStyle
  }
  // Use timeStandaloneStyle
```

The key change is moving all `useAnimatedStyle` hooks to the top, before any conditional returns.

---

_**User**_

Maybe create a separate component to handle the time or something like that?

---

_**Assistant**_

Yes, that's a cleaner approach! We can split it into two components:

```typescript:features/conversation/conversation-message-time.tsx
import { useMessageContextStore, useMessageContextStoreContext } from "@/features/conversation/conversation-message.store-context";
import { AnimatedHStack } from "@design-system/HStack";
import { AnimatedText, Text } from "@design-system/Text";
import { getTextStyle } from "@design-system/Text/Text.utils";
import { AnimatedVStack } from "@design-system/VStack";
import { SICK_DAMPING, SICK_STIFFNESS } from "@theme/animations";
import { useAppTheme } from "@theme/useAppTheme";
import { getLocalizedTime, getRelativeDate } from "@utils/date";
import { flattenStyles } from "@utils/styles";
import { memo, useEffect } from "react";
import { interpolate, useAnimatedStyle, useDerivedValue, useSharedValue, withSpring } from "react-native-reanimated";

const StandaloneTime = memo(function StandaloneTime({ messageTime }: { messageTime: string }) {
  const { themed, theme } = useAppTheme();
  const showTimeAV = useSharedValue(0);
  const messageStore = useMessageContextStore();

  useEffect(() => {
    const unsubscribe = messageStore.subscribe(
      (state) => state.isShowingTime,
      (isShowingTime) => {
        showTimeAV.value = isShowingTime ? 1 : 0;
      }
    );
    return () => unsubscribe();
  }, [messageStore, showTimeAV]);

  const textHeight = flattenStyles(getTextStyle(themed, { preset: "smaller" })).lineHeight;

  const showTimeProgressAV = useDerivedValue(() => {
    return withSpring(showTimeAV.value ? 1 : 0, {
      damping: SICK_DAMPING,
      stiffness: SICK_STIFFNESS,
    });
  });

  const timeAnimatedStyle = useAnimatedStyle(() => ({
    height: interpolate(showTimeProgressAV.value, [0, 1], [0, textHeight || 14]),
    opacity: interpolate(showTimeProgressAV.value, [0, 1], [0, 1]),
    marginVertical: interpolate(showTimeProgressAV.value, [0, 1], [0, theme.spacing.sm]),
    transform: [
      { scale: showTimeProgressAV.value },
      { translateY: interpolate(showTimeProgressAV.value, [0, 1], [theme.spacing.xl, 0]) },
    ],
  }), [textHeight]);

  return (
    <AnimatedVStack
      style={[
        {
          alignItems: "center",
          overflow: "hidden",
          width: "100%",
        },
        timeAnimatedStyle,
      ]}
    >
      <Text preset="smaller" color="secondary">
        {messageTime}
      </Text>
    </AnimatedVStack>
  );
});

const InlineTime = memo(function InlineTime({ messageTime, messageDate }: { messageTime: string; messageDate: string }) {
  const { theme } = useAppTheme();
  const showTimeAV = useSharedValue(0);
  const messageStore = useMessageContextStore();

  useEffect(() => {
    const unsubscribe = messageStore.subscribe(
      (state) => state.isShowingTime,
      (isShowingTime) => {
        showTimeAV.value = isShowingTime ? 1 : 0;
      }
    );
    return () => unsubscribe();
  }, [messageStore, showTimeAV]);

  const timeInlineAnimatedStyle = useAnimatedStyle(() => ({
    display: showTimeAV.value ? "flex" : "none",
    opacity: withSpring(showTimeAV.value ? 1 : 0, {
      damping: SICK_DAMPING,
      stiffness: SICK_STIFFNESS,
    }),
  }));

  return (
    <AnimatedHStack
      layout={theme.animation.reanimatedLayoutSpringTransition}
      style={{
        alignSelf: "center",
        alignItems: "center",
        justifyContent: "center",
        columnGap: theme.spacing["4xs"],
        marginVertical: theme.spacing.sm,
      }}
    >
      <Text preset="smaller" color="secondary">
        {messageDate}
      </Text>
      <AnimatedText preset="smaller" color="secondary" style={timeInlineAnimatedStyle}>
        {messageTime}
      </AnimatedText>
    </AnimatedHStack>
  );
});

export const ConversationMessageTime = memo(function ConversationMessageTime() {
  const [sentAt, showDateChange] = useMessageContextStoreContext((s) => [
    s.sentAt,
    s.showDateChange,
  ]);

  const messageTime = sentAt ? getLocalizedTime(sentAt) : "";

  if (showDateChange) {
    const messageDate = getRelativeDate(sentAt);
    return <InlineTime messageTime={messageTime} messageDate={messageDate} />;
  }

  return <StandaloneTime messageTime={messageTime} />;
});
```

The main changes:
1. Split into three components: parent controller and two specialized time display components
2. Each component now has its own hooks at the top level
3. Cleaner separation of concerns between inline and standalone displays
4. Parent component just handles the logic of which variant to show

---



---

