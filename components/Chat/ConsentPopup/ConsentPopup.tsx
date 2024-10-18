import { translate } from "@i18n";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  actionSheetColors,
  backgroundColor,
  textPrimaryColor,
} from "@styles/colors";
import React from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";

import {
  currentAccount,
  getSettingsStore,
  useSettingsStore,
} from "../../../data/store/accountsStore";
import { Button } from "../../../design-system/Button/Button";
import { NavigationParamList } from "../../../screens/Navigation/Navigation";
import { useConversationContext } from "../../../utils/conversation";
import { consentToPeersOnProtocol } from "../../../utils/xmtpRN/conversations";
import { showActionSheetWithOptions } from "../../StateHandlers/ActionSheetStateHandler";

export default function ConsentPopup() {
  const conversation = useConversationContext("conversation");
  const isBlockedPeer = useConversationContext("isBlockedPeer");

  const navigation = useNavigation() as NativeStackNavigationProp<
    NavigationParamList,
    "Chats",
    undefined
  >;

  const styles = useStyles();
  const colorScheme = useColorScheme();

  const setPeersStatus = useSettingsStore((s) => s.setPeersStatus);
  const { peersStatus } = getSettingsStore(currentAccount()).getState();
  const thisPeerStatus = conversation?.peerAddress
    ? peersStatus[conversation.peerAddress.toLowerCase()]
    : "";

  // Determine whether to show the consent window based on various conditions
  const shouldShowConsentWindow =
    conversation &&
    conversation.messages.size > 0 &&
    thisPeerStatus !== "consented" &&
    !isBlockedPeer &&
    !conversation.pending &&
    !conversation.hasOneMessageFromMe &&
    !conversation.isGroup;

  if (!shouldShowConsentWindow) {
    // Consent window will not be displayed
    return null;
  }

  return (
    <View style={styles.chatConsentContainer}>
      <Text style={styles.info}>{translate("do_you_trust_this_contact")}</Text>
      <View style={styles.buttonsContainer}>
        <Button
          action="danger"
          picto="xmark"
          title={translate("block")}
          style={styles.cta}
          onPress={() => {
            showActionSheetWithOptions(
              {
                options: [translate("block"), translate("cancel")],
                cancelButtonIndex: 1,
                destructiveButtonIndex: 0,
                title: translate("if_you_block_contact"),
                ...actionSheetColors(colorScheme),
              },
              (selectedIndex?: number) => {
                if (selectedIndex === 0 && conversation.peerAddress) {
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
          variant="outline"
          picto="checkmark"
          title={translate("accept")}
          style={styles.cta}
          onPress={() => {
            if (!conversation.peerAddress) return;
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
