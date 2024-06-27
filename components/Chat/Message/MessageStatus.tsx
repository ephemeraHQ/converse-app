import { textSecondaryColor } from "@styles/colors";
import React from "react";
import { StyleSheet, Text, useColorScheme } from "react-native";

import { MessageToDisplay } from "./Message";

type Props = {
  message: MessageToDisplay;
};

export default function MessageStatus({ message }: Props) {
  const styles = useStyles();

  return (
    message.fromMe &&
    (message.status === "sending" ? (
      <Text style={styles.statusText}>Encrypted</Text>
    ) : (
      <Text style={styles.statusText}>Sent</Text>
    ))
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    statusText: {
      fontSize: 11,
      color: textSecondaryColor(colorScheme),
      marginRight: 3,
    },
  });
};
