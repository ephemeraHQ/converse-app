import React from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";

import { textPrimaryColor } from "../../../utils/colors";
import { getTime } from "../../../utils/date";
import { MessageToDisplay } from "./Message";

type Props = {
  message: MessageToDisplay;
  white: boolean;
};

export default function MessageTimestamp({ message, white }: Props) {
  const styles = useStyles();
  return (
    <View style={styles.metadata}>
      <Text style={[styles.time, white ? styles.timeWhite : undefined]}>
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
    timeWhite: {
      color: "white",
    },
  });
};
