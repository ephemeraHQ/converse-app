import React from "react";
import { StyleSheet, useColorScheme, View } from "react-native";

import Checkmark from "../../../assets/checkmark.svg";
import Clock from "../../../assets/clock.svg";
import { textSecondaryColor } from "../../../utils/colors";
import { MessageToDisplay } from "./Message";

type Props = {
  message: MessageToDisplay;
};

export default function MessageStatus({ message }: Props) {
  const styles = useStyles();
  const colorScheme = useColorScheme();

  return (
    <View style={styles.metadata}>
      {message.fromMe && (
        <View style={styles.statusIconContainer}>
          {message.status === "sending" ? (
            <Clock
              style={styles.statusIcon}
              fill={textSecondaryColor(colorScheme)}
              width={8}
              height={8}
            />
          ) : (
            <Checkmark
              style={styles.statusIcon}
              fill={textSecondaryColor(colorScheme)}
              width={8}
              height={8}
            />
          )}
        </View>
      )}
    </View>
  );
}

const useStyles = () => {
  return StyleSheet.create({
    metadata: {
      flexDirection: "row",
      alignSelf: "flex-start",
      opacity: 0.6,
      padding: 7,
      paddingHorizontal: 2,
    },
    statusIconContainer: {
      marginLeft: 3,
      width: 9,
    },
    statusIcon: {},
  });
};
