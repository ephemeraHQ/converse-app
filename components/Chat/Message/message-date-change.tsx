import { useMessageContext } from "@/components/Chat/Message/contexts/message-context";
import { useMessageContextStoreContext } from "@/components/Chat/Message/stores/message-store";
import { AnimatedHStack } from "@design-system/HStack";
import { AnimatedText, Text } from "@design-system/Text";
import { SICK_DAMPING, SICK_STIFFNESS } from "@theme/animations";
import { useAppTheme } from "@theme/useAppTheme";
import { getLocalizedTime, getRelativeDate } from "@utils/date";
import { memo } from "react";
import {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from "react-native-reanimated";

export const MessageDateChange = memo(function MessageDateChange() {
  const { theme } = useAppTheme();

  const [sentAt, showDateChange] = useMessageContextStoreContext((s) => [
    s.sentAt,
    s.showDateChange,
  ]);

  const { showTimeAV } = useMessageContext();

  const showTimeProgressAV = useDerivedValue(() => {
    return withSpring(showTimeAV.value ? 1 : 0, {
      damping: SICK_DAMPING,
      stiffness: SICK_STIFFNESS,
    });
  });

  const messageTime = sentAt ? getLocalizedTime(sentAt) : "";

  const timeInlineAnimatedStyle = useAnimatedStyle(() => {
    return {
      display: showTimeAV.value ? "flex" : "none",
      opacity: interpolate(showTimeProgressAV.value, [0, 1], [0, 1]),
    };
  });

  if (!showDateChange) {
    return null;
  }

  const messageDate = getRelativeDate(sentAt);

  return (
    <AnimatedHStack
      layout={theme.animation.reanimatedSpringLayoutTransition}
      style={{
        // ...debugBorder("red"),
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
