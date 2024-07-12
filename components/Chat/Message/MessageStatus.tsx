import { textSecondaryColor } from "@styles/colors";
import React, { useEffect, useRef } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { MessageToDisplay } from "./Message";

type Props = {
  message: MessageToDisplay;
};

const statusMapping: {
  [key: string]: string | undefined;
} = {
  sent: "Sent",
  delivered: "Sent",
  error: "Failed",
  sending: "Sending",
  seen: "Read",
};

export default function MessageStatus({ message }: Props) {
  const styles = useStyles();
  const prevStatusRef = useRef(message.status);
  const isSentOrDelivered =
    message.status === "sent" || message.status === "delivered";
  const isLatestSettledFromMe = message.isLatestSettledFromMe;

  const opacity = useSharedValue(0);
  const height = useSharedValue(0);
  const scale = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    height: height.value,
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = message.status;

    const timingConfig = {
      duration: 100,
      easing: Easing.inOut(Easing.quad),
    };

    if (
      isSentOrDelivered &&
      (prevStatus === "sending" || prevStatus === "prepared")
    ) {
      opacity.value = withTiming(1, timingConfig);
      height.value = withTiming(22, timingConfig);
      scale.value = withTiming(1, timingConfig);
    } else if (isSentOrDelivered && !isLatestSettledFromMe) {
      opacity.value = withTiming(0, timingConfig);
      height.value = withTiming(0, timingConfig);
      scale.value = withTiming(0, timingConfig);
    } else if (isLatestSettledFromMe) {
      opacity.value = 1;
      height.value = 22;
      scale.value = 1;
    }
  }, [
    message.status,
    isLatestSettledFromMe,
    isSentOrDelivered,
    height,
    opacity,
    scale,
  ]);

  return (
    message.fromMe &&
    message.status != "sending" && (
      <Animated.View style={[styles.container, animatedStyle]}>
        <View style={styles.contentContainer}>
          <Animated.Text style={styles.statusText}>
            {statusMapping[message.status]}
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
      paddingVertical: 5,
    },
    statusText: {
      fontSize: 12,
      color: textSecondaryColor(colorScheme),
      marginRight: 3,
    },
  });
};
