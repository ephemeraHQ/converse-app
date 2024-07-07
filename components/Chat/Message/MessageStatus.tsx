import { textSecondaryColor } from "@styles/colors";
import React, { useEffect, useRef } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
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
  const isLatestFinished = message.isLatestFinished;

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

    if (isSentOrDelivered && prevStatus === "sending") {
      opacity.value = withTiming(1, { duration: 100 });
      height.value = withTiming(22, { duration: 100 });
      scale.value = withTiming(1, { duration: 100 });
    } else if (isSentOrDelivered && !isLatestFinished) {
      opacity.value = withTiming(0, { duration: 100 });
      height.value = withTiming(0, { duration: 100 });
      scale.value = withTiming(0, { duration: 100 });
    } else if (isLatestFinished) {
      opacity.value = 1;
      height.value = 22;
      scale.value = 1;
    }
  }, [
    message.status,
    isLatestFinished,
    isSentOrDelivered,
    height,
    opacity,
    scale,
  ]);

  return (
    message.fromMe && (
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
