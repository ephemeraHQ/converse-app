import { textSecondaryColor } from "@styles/colors";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, useColorScheme, Animated, View } from "react-native";

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
  const [prevStatus, setPrevStatus] = useState(message.status);
  const isSentOrDelivered =
    message.status === "sent" || message.status === "delivered";
  const isLatestFinished = message.isLatestFinished;
  const opacityAnim = useRef(
    new Animated.Value(isSentOrDelivered && isLatestFinished ? 1 : 0)
  ).current;
  const heightAnim = useRef(
    new Animated.Value(isSentOrDelivered && isLatestFinished ? 22 : 0)
  ).current;
  const scaleAnim = useRef(
    new Animated.Value(isSentOrDelivered && isLatestFinished ? 1 : 0)
  ).current;
  const shouldAnimateIn = isSentOrDelivered && prevStatus === "sending";
  const shouldAnimateOut = isSentOrDelivered && !isLatestFinished;

  useEffect(() => {
    if (shouldAnimateIn) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(heightAnim, {
          toValue: 22,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    } else if (shouldAnimateOut) {
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(heightAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }),
        ]).start();
      }, 300);
      return () => clearTimeout(timer);
    }
    setPrevStatus(message.status);
  }, [
    message.status,
    message.isLatestFinished,
    heightAnim,
    opacityAnim,
    scaleAnim,
    shouldAnimateIn,
    shouldAnimateOut,
  ]);

  return (
    message.fromMe && (
      <Animated.View
        style={[
          styles.container,
          { height: heightAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.contentContainer}>
          <Animated.Text style={[styles.statusText, { opacity: opacityAnim }]}>
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
      height: 22,
      paddingVertical: 5,
    },
    statusText: {
      fontSize: 12,
      color: textSecondaryColor(colorScheme),
      marginRight: 3,
    },
  });
};
