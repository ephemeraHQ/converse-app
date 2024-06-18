import React from "react";
import { StyleSheet, useColorScheme, View } from "react-native";

import Checkmark from "../../../assets/checkmark.svg";
import Clock from "../../../assets/clock.svg";
import { backgroundColor } from "../../../utils/colors";
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
              fill={styles.time.color}
              width={8}
              height={8}
            />
          ) : (
            <Checkmark
              style={styles.statusIcon}
              fill={styles.time.color}
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
    },
    time: {
      fontSize: 8,
      color: backgroundColor(colorScheme),
      marginRight: 3,
    },
    timeWhite: {
      color: "white",
    },
    statusIconContainer: {
      marginLeft: 3,
      width: 9,
    },
    statusIcon: {},
  });
};
