import { View, StyleSheet, useColorScheme, Platform, Text } from "react-native";

import {
  backgroundColor,
  tertiaryBackgroundColor,
  textPrimaryColor,
} from "../../utils/colors";
import { useConversationContext } from "../../utils/conversation";
import Button from "../Button/Button";

export default function ChatConsent() {
  const { conversation } = useConversationContext(["conversation"]);
  const styles = useStyles();

  const deleteChat = function () {
    console.log("delete");
  };

  const acceptChat = function () {
    console.log("accept");
  };

  return (
    <View style={styles.chatConsentContainer}>
      <Text style={styles.info}>Do you trust this contact?</Text>

      <View style={styles.buttonsContainer}>
        <Button
          variant="secondary-danger"
          picto="trash"
          title="Delete"
          style={styles.cta}
          onPress={() => {
            deleteChat();
          }}
        />
        <Button
          variant="secondary"
          picto="checkmark"
          title="Accept"
          style={styles.cta}
          onPress={() => {
            acceptChat();
          }}
        />
      </View>
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    chatConsentContainer: {
      backgroundColor:
        Platform.OS === "android"
          ? backgroundColor(colorScheme)
          : tertiaryBackgroundColor(colorScheme),
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 17,
      paddingHorizontal: 10,
      marginTop: 10,
    },
    info: {
      color: textPrimaryColor(colorScheme),
      textAlign: "center",
      fontSize: 15,
    },
    buttonsContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 10,
    },
    cta: {
      alignSelf: "center",
      marginHorizontal: 6,
    },
  });
};
