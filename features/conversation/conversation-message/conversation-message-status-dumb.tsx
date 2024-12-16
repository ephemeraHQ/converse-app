import { translate } from "@i18n";
import { textSecondaryColor } from "@styles/colors";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

const statusMapping = {
  sent: translate("message_status.sent"),
  delivered: translate("message_status.delivered"),
  error: translate("message_status.error"),
  sending: translate("message_status.sending"),
  prepared: translate("message_status.prepared"),
  seen: translate("message_status.seen"),
};

type MessageStatusDumbProps = {
  //
  shouldDisplay: boolean;
  isLatestSettledFromMe: boolean;
  status: keyof typeof statusMapping;
};

export function MessageStatusDumb({
  shouldDisplay,
  isLatestSettledFromMe,
  status,
}: MessageStatusDumbProps) {
  const styles = useStyles();
  const prevStatusRef = useRef(status);
  const isSentOrDelivered = status === "sent" || status === "delivered";

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
          if (
            isSentOrDelivered &&
            (prevStatus === "sending" || prevStatus === "prepared")
          ) {
            opacity.value = withTiming(1, timingConfig);
            height.value = withTiming(22, timingConfig);
            scale.value = withTiming(1, timingConfig);
            setRenderText(true);
          } else if (isSentOrDelivered && !isLatestSettledFromMe) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isLatestSettledFromMe, isSentOrDelivered]
  );

  return (
    shouldDisplay && (
      <Animated.View style={[styles.container, animatedStyle]}>
        <View style={styles.contentContainer}>
          <Animated.Text style={styles.statusText}>
            {renderText && statusMapping[status]}
          </Animated.Text>
        </View>
      </Animated.View>
    )
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    container: {
      overflow: "hidden",
    },
    contentContainer: {
      paddingTop: 5,
    },
    statusText: {
      fontSize: 12,
      color: textSecondaryColor(colorScheme),
    },
  });
};
