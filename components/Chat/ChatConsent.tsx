import { View, StyleSheet, useColorScheme, Platform, Text } from "react-native";

import { backgroundColor, tertiaryBackgroundColor } from "../../utils/colors";
import { useConversationContext } from "../../utils/conversation";

export default function ChatConsent() {
  const { conversation } = useConversationContext(["conversation"]);

  const colorScheme = useColorScheme();
  const styles = useStyles();

  return (
    <View style={styles.chatConsentContainer}>
      <Text>Do you trust this contact?</Text>
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
      flexDirection: "row",
    },
  });
};
