import { textSecondaryColor } from "@styles/colors";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, useColorScheme, Animated } from "react-native";

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
  const isVisibleRef = useRef(isSentOrDelivered && isLatestFinished);
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
  const shouldAnimateOut =
    isSentOrDelivered && !isLatestFinished && isVisibleRef.current;

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
          useNativeDriver: true,
        }),
      ]).start();
      isVisibleRef.current = true;
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
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
        isVisibleRef.current = false;
      }, 300);
      return () => clearTimeout(timer);
    }

    if (!isLatestFinished) {
      isVisibleRef.current = false;
    }

    setPrevStatus(message.status);
  }, [
    message.status,
    isLatestFinished,
    heightAnim,
    opacityAnim,
    scaleAnim,
    shouldAnimateIn,
    shouldAnimateOut,
  ]);

  return (
    message.fromMe && (
      <Animated.View style={[styles.container, { height: heightAnim }]}>
        <Animated.View style={styles.contentContainer}>
          <Animated.Text
            style={[
              styles.statusText,
              { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
            {statusMapping[message.status]}
          </Animated.Text>
        </Animated.View>
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
