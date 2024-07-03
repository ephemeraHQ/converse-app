import { textSecondaryColor } from "@styles/colors";
import React, { useEffect, useRef } from "react";
import { StyleSheet, useColorScheme, Animated } from "react-native";

import { MessageToDisplay } from "./Message";

type Props = {
  message: MessageToDisplay;
};

export default function MessageStatus({ message }: Props) {
  const styles = useStyles();
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const heightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (message.status === "sent") {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(heightAnim, {
          toValue: 20,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(heightAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [message.status, opacityAnim, heightAnim]);

  return (
    message.fromMe && (
      <Animated.View style={[styles.container, { height: heightAnim }]}>
        <Animated.Text style={[styles.statusText, { opacity: opacityAnim }]}>
          Sent
        </Animated.Text>
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
    statusText: {
      fontSize: 12,
      color: textSecondaryColor(colorScheme),
      marginRight: 3,
    },
  });
};
