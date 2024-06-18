import React from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";

import Checkmark from "../../../assets/checkmark.svg";
import Clock from "../../../assets/clock.svg";
import { backgroundColor } from "../../../utils/colors";
import { getTime } from "../../../utils/date";
import { MessageToDisplay } from "./Message";

type Props = {
  message: MessageToDisplay;
  white: boolean;
};

export default function MessageMetadata({ message, white }: Props) {
  const styles = useStyles();
  return (
    <View style={styles.metadata}>
      <Text style={[styles.time, white ? styles.timeWhite : undefined]}>
        {getTime(message.sent)}
      </Text>
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
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    metadata: {
      paddingLeft: 5,
      height: 10,
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
      height: 9,
    },
    statusIcon: {},
  });
};
