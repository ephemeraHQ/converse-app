// temp for UI state pending Zustand
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  useColorScheme,
  Platform,
  Text,
  Alert,
} from "react-native";

import { currentAccount, useChatStore } from "../../data/store/accountsStore";
import { XmtpConversationWithUpdate } from "../../data/store/chatStore";
import { consentToTopics, deleteTopic } from "../../utils/api";
import {
  backgroundColor,
  tertiaryBackgroundColor,
  textPrimaryColor,
} from "../../utils/colors";
import { shortAddress } from "../../utils/str";
import Button from "../Button/Button";
// useConversationContext
// useNavigation hook react navigation

export default function ChatConsent({
  navigation,
  conversation,
}: {
  navigation: NativeStackNavigationProp<any>;
  conversation: XmtpConversationWithUpdate | undefined;
}) {
  const styles = useStyles();
  const markTopicsAsDeleted = useChatStore((s) => s.markTopicsAsDeleted);
  const [consent, setConsent] = useState(false);

  const colorScheme = useColorScheme();

  const acceptChat = function (topic: string) {
    console.log("===== Consent to topic:", topic);
    consentToTopics(currentAccount(), [topic]);
    // setConsent(true);
  };

  if (!conversation) {
    return null;
  }

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
            Alert.alert(
              `Delete chat with ${shortAddress(conversation.peerAddress)}?`,
              undefined,
              [
                {
                  text: "Cancel",
                },
                {
                  text: "Delete",
                  style: "destructive",
                  isPreferred: true,
                  onPress: () => {
                    // to put in a utils/convo helper
                    deleteTopic(currentAccount(), conversation.topic);
                    markTopicsAsDeleted([conversation.topic]);
                    navigation.pop();
                  },
                },
              ]
            );
          }}
        />
        <Button
          variant="secondary"
          picto="checkmark"
          title="Accept"
          style={styles.cta}
          onPress={() => {
            acceptChat(conversation.topic);
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
