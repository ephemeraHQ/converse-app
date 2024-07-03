import { textPrimaryColor } from "@styles/colors";
import React from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";

import { MessageToDisplay } from "./Message";
import { getTime } from "../../../utils/date";

type Props = {
  message: MessageToDisplay;
  white: boolean;
  hiddenBackground?: boolean;
};

export default function MessageTimestamp({
  message,
  white,
  hiddenBackground = false,
}: Props) {
  const styles = useStyles();
  return (
    <View style={styles.metadata}>
      <Text
        style={[
          styles.time,
          hiddenBackground
            ? styles.timeOnHiddenBackground
            : white
            ? styles.timeWhite
            : undefined,
        ]}
      >
        {getTime(message.sent)}
      </Text>
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
      color: textPrimaryColor(colorScheme),
      marginRight: 3,
    },
    timeOnHiddenBackground: {
      color: textPrimaryColor(colorScheme),
    },
    timeWhite: {
      color: "white",
    },
  });
};
