import { useMessageContext } from "@/components/Chat/Message/contexts/message-context";
import { useMessageContextStoreContext } from "@/components/Chat/Message/stores/message-store";
import { debugBorder } from "@/utils/debug-style";
import { Text } from "@design-system/Text";
import { getTextStyle } from "@design-system/Text/Text.utils";
import { AnimatedVStack } from "@design-system/VStack";
import { SICK_DAMPING, SICK_STIFFNESS } from "@theme/animations";
import { useAppTheme } from "@theme/useAppTheme";
import { getLocalizedTime } from "@utils/date";
import { flattenStyles } from "@utils/styles";
import { memo } from "react";
import {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from "react-native-reanimated";

export const MessageTimestamp = memo(function MessageTimestamp() {
  const { theme, themed } = useAppTheme();

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

  const textHeight = flattenStyles(
    getTextStyle(themed, { preset: "smaller" })
  ).lineHeight;

  const timeAnimatedStyle = useAnimatedStyle(() => {
    return {
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
    };
  }, [textHeight]);

  // Because we'll show the time in the MessageDateChange component instead
  if (showDateChange) {
    return null;
  }

  return (
    <AnimatedVStack
      style={[
        {
          //   ...debugBorder("yellow"),
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
