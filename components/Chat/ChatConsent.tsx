import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { View, StyleSheet, useColorScheme, Text } from "react-native";

import {
  currentAccount,
  getChatStore,
  useSettingsStore,
  getSettingsStore,
} from "../../data/store/accountsStore";
import { NavigationParamList } from "../../screens/Navigation/Navigation";
import {
  actionSheetColors,
  backgroundColor,
  textPrimaryColor,
} from "../../utils/colors";
import { useConversationContext } from "../../utils/conversation";
import { consentToPeersOnProtocol } from "../../utils/xmtpRN/conversations";
import Button from "../Button/Button";
import { showActionSheetWithOptions } from "../StateHandlers/ActionSheetStateHandler";

export default function ChatConsent() {
  const { conversation, isBlockedPeer } = useConversationContext([
    "conversation",
    "isBlockedPeer",
  ]);

  const navigation = useNavigation() as NativeStackNavigationProp<
    NavigationParamList,
    "Chats",
    undefined
  >;

  const styles = useStyles();
  const colorScheme = useColorScheme();

  const { topicsStatus } = getChatStore(currentAccount()).getState();
  const thisTopicStatus = topicsStatus[conversation?.topic || ""];
  const setPeersStatus = useSettingsStore((s) => s.setPeersStatus);
  const { peersStatus } = getSettingsStore(currentAccount()).getState();
  const thisPeerStatus = conversation?.peerAddress
    ? peersStatus[conversation.peerAddress.toLowerCase()]
    : "";

  // Determine whether to show the consent window based on various conditions
  const shouldShowConsentWindow =
    conversation &&
    conversation.messages.size > 0 &&
    thisTopicStatus !== "consented" &&
    thisPeerStatus !== "consented" &&
    !isBlockedPeer &&
    !conversation.pending &&
    !conversation.hasOneMessageFromMe;

  if (!shouldShowConsentWindow) {
    // Consent window will not be displayed
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
            showActionSheetWithOptions(
              {
                options: ["Block", "Cancel"],
                cancelButtonIndex: 1,
                destructiveButtonIndex: 0,
                title: `If you block this contact, you will not receive messages from them anymore`,
                ...actionSheetColors(colorScheme),
              },
              (selectedIndex?: number) => {
                if (selectedIndex === 0) {
                  consentToPeersOnProtocol(
                    currentAccount(),
                    [conversation.peerAddress],
                    "deny"
                  );
                  setPeersStatus({ [conversation.peerAddress]: "blocked" });
                  navigation.pop();
                }
              }
            );
          }}
        />
        <Button
          variant="secondary"
          picto="checkmark"
          title="Accept"
          style={styles.cta}
          onPress={() => {
            consentToPeersOnProtocol(
              currentAccount(),
              [conversation.peerAddress],
              "allow"
            );
            setPeersStatus({ [conversation.peerAddress]: "consented" });
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
      backgroundColor: backgroundColor(colorScheme),
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
