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
  prepared: "Sending",
  seen: "Read",
};

export default function MessageStatus({ message }: Props) {
  const styles = useStyles();
  const prevStatusRef = useRef(message.status);
  const isSentOrDelivered =
    message.status === "sent" || message.status === "delivered";
  const isLatestSettledFromMe = message.isLatestSettledFromMe;

  const opacity = useSharedValue(message.isLatestSettledFromMe ? 1 : 0);
  const height = useSharedValue(message.isLatestSettledFromMe ? 22 : 0);
  const scale = useSharedValue(message.isLatestSettledFromMe ? 1 : 0);

  const timingConfig = {
    duration: 100,
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
      prevStatusRef.current = message.status;

      setTimeout(() => {
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
      }, 200);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isLatestSettledFromMe, isSentOrDelivered]
  );

  return (
    message.fromMe &&
    message.status != "sending" &&
    message.status != "prepared" && (
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
      paddingTop: 5,
    },
    statusText: {
      fontSize: 12,
      color: textSecondaryColor(colorScheme),
      marginRight: 3,
    },
  });
};
