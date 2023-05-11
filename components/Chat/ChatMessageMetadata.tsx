import format from "date-fns/format";
import React from "react";
import {
  ColorSchemeName,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import Checkmark from "../../assets/checkmark.svg";
import Clock from "../../assets/clock.svg";
import ConverseMessageBubble from "../../assets/message-bubble.svg";
import { textPrimaryColor } from "../../utils/colors";
import { MessageToDisplay } from "./ChatMessage";

type Props = {
  message: MessageToDisplay;
};

export default function ChatMessageMetadata({ message }: Props) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  return (
    <View style={styles.metadata}>
      <Text style={[styles.time, message.fromMe ? styles.timeMe : undefined]}>
        {format(message.sent, "HH:mm")}
      </Text>
      {message.sentViaConverse && (
        <ConverseMessageBubble
          style={styles.statusIcon}
          fill={message.fromMe ? "white" : textPrimaryColor(colorScheme)}
          width={9}
          height={9}
        />
      )}
      {message.fromMe && (
        <View style={styles.statusIconContainer}>
          {message.status === "sending" ? (
            <Clock
              style={styles.statusIcon}
              fill="white"
              width={8}
              height={8}
            />
          ) : (
            <Checkmark
              style={styles.statusIcon}
              fill="white"
              width={8}
              height={8}
            />
          )}
        </View>
      )}
    </View>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
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
    timeMe: {
      color: "white",
    },
    statusIconContainer: {
      marginLeft: 3,
      width: 9,
      height: 9,
    },
    statusIcon: {},
  });
