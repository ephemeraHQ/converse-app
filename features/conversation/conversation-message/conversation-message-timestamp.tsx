import {
  useMessageContextStore,
  useMessageContextStoreContext,
} from "@/features/conversation/conversation-message/conversation-message.store-context";
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

const StandaloneTime = memo(function StandaloneTime({
  messageTime,
}: {
  messageTime: string;
}) {
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

  const textHeight = flattenStyles(
    getTextStyle(themed, { preset: "smaller" })
  ).lineHeight;

  const showTimeProgressAV = useDerivedValue(() => {
    return withSpring(showTimeAV.value ? 1 : 0, {
      damping: SICK_DAMPING,
      stiffness: SICK_STIFFNESS,
    });
  });

  const timeAnimatedStyle = useAnimatedStyle(
    () => ({
      height: interpolate(
        showTimeProgressAV.value,
        [0, 1],
        [0, textHeight || 14]
      ),
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
    }),
    [textHeight]
  );

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

const InlineTime = memo(function InlineTime({
  messageTime,
  messageDate,
}: {
  messageTime: string;
  messageDate: string;
}) {
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
      <AnimatedText
        preset="smaller"
        color="secondary"
        style={timeInlineAnimatedStyle}
      >
        {messageTime}
      </AnimatedText>
    </AnimatedHStack>
  );
});

export const ConversationMessageTimestamp = memo(
  function ConversationMessageTimestamp() {
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
  }
);
