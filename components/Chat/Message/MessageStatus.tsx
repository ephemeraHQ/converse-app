import React from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";

import { textSecondaryColor } from "../../../utils/colors";
import { MessageToDisplay } from "./Message";

type Props = {
  message: MessageToDisplay;
};

export default function MessageStatus({ message }: Props) {
  const styles = useStyles();

  return (
    <View style={styles.metadata}>
      {message.fromMe &&
        (message.status === "sending" ? (
          <Text style={styles.statusText}>Encrypted</Text>
        ) : (
          <Text style={styles.statusText}>Sent</Text>
        ))}
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    metadata: {
      flexDirection: "row",
      alignSelf: "flex-start",
      padding: 7,
      paddingHorizontal: 2,
    },
    statusText: {
      fontSize: 11,
      color: textSecondaryColor(colorScheme),
      marginRight: 3,
    },
  });
};
