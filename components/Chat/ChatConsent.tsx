import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import {
  View,
  StyleSheet,
  useColorScheme,
  Platform,
  Text,
  Alert,
} from "react-native";

import {
  currentAccount,
  useChatStore,
  useSettingsStore,
} from "../../data/store/accountsStore";
import { NavigationParamList } from "../../screens/Navigation/Navigation";
import { consentToTopics, blockPeers } from "../../utils/api";
import {
  backgroundColor,
  tertiaryBackgroundColor,
  textPrimaryColor,
} from "../../utils/colors";
import { useConversationContext } from "../../utils/conversation";
import { shortAddress } from "../../utils/str";
import Button from "../Button/Button";

export default function ChatConsent() {
  const { conversation } = useConversationContext(["conversation"]);
  const navigation = useNavigation() as NativeStackNavigationProp<
    NavigationParamList,
    "Chats",
    undefined
  >;

  const styles = useStyles();
  const setTopicsStatus = useChatStore((s) => s.setTopicsStatus);
  const topicsStatus = useChatStore((s) => s.topicsStatus);
  const setPeersStatus = useSettingsStore((s) => s.setPeersStatus);
  const thisTopicStatus = topicsStatus[conversation?.topic || ""];

  // @todo add pre-consented check if 1 message is already sent
  if (
    !conversation ||
    thisTopicStatus === "consented" ||
    conversation.pending
  ) {
    return null;
  }

  return (
    <View style={styles.chatConsentContainer}>
      <Text style={styles.info}>Do you trust this contact?</Text>
      <View style={styles.buttonsContainer}>
        <Button
          variant="secondary-danger"
          picto="xmark"
          title="Block"
          style={styles.cta}
          onPress={() => {
            Alert.alert(
              `Block user ${shortAddress(conversation.peerAddress)}?`,
              undefined,
              [
                {
                  text: "Cancel",
                },
                {
                  text: "Block",
                  style: "destructive",
                  isPreferred: true,
                  onPress: () => {
                    blockPeers(currentAccount(), [conversation.peerAddress]);
                    setPeersStatus({ [conversation.peerAddress]: "blocked" });
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
            consentToTopics(currentAccount(), [conversation.topic]);
            setTopicsStatus({ [conversation.topic]: "consented" });
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
