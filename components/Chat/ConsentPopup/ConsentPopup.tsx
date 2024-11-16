import { Button } from "@design-system/Button/Button";
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
import { NavigationParamList } from "../../../screens/Navigation/Navigation";
import { useConversationContext } from "../../../utils/conversation";
import {
  consentToAddressesOnProtocolByAccount,
  consentToInboxIdsOnProtocolByAccount,
} from "../../../utils/xmtpRN/contacts";
import { showActionSheetWithOptions } from "../../StateHandlers/ActionSheetStateHandler";
import { DmWithCodecsType } from "@utils/xmtpRN/client";

type ConsentPopupProps = {
  conversation: DmWithCodecsType;
};

export default function ConsentPopup({ conversation }: ConsentPopupProps) {
  const navigation = useNavigation() as NativeStackNavigationProp<
    NavigationParamList,
    "Chats",
    undefined
  >;

  const styles = useStyles();
  const colorScheme = useColorScheme();

  const setPeersStatus = useSettingsStore((s) => s.setPeersStatus);
  const thisPeerStatus = conversation.state;

  // Determine whether to show the consent window based on various conditions
  const shouldShowConsentWindow = conversation && thisPeerStatus !== "allowed";
  if (!shouldShowConsentWindow) {
    // Consent window will not be displayed
    return null;
  }

  return (
    <View style={styles.chatConsentContainer}>
      <Text style={styles.info}>{translate("do_you_trust_this_contact")}</Text>
      <View style={styles.buttonsContainer}>
        <Button
          variant="text"
          action="danger"
          picto="xmark"
          text={translate("block")}
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
              async (selectedIndex?: number) => {
                if (selectedIndex === 0) {
                  const inboxId = await conversation.peerInboxId();
                  consentToInboxIdsOnProtocolByAccount({
                    account: currentAccount(),
                    inboxIds: [inboxId],
                    consent: "deny",
                  });
                  navigation.pop();
                }
              }
            );
          }}
        />
        <Button
          variant="fill"
          picto="checkmark"
          text={translate("accept")}
          style={styles.cta}
          onPress={async () => {
            const inboxId = await conversation.peerInboxId();
            consentToInboxIdsOnProtocolByAccount({
              account: currentAccount(),
              inboxIds: [inboxId],
              consent: "allow",
            });
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
