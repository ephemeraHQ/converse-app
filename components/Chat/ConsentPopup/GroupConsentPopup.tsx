import { useSelect } from "@data/store/storeHelpers";
import { useGroupConsent } from "@hooks/useGroupConsent";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  actionSheetColors,
  backgroundColor,
  textPrimaryColor,
} from "@styles/colors";
import { strings } from "@utils/i18n/strings";
import React, { useCallback } from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";

import {
  useCurrentAccount,
  useSettingsStore,
} from "../../../data/store/accountsStore";
import { NavigationParamList } from "../../../screens/Navigation/Navigation";
import { useConversationContext } from "../../../utils/conversation";
import Button from "../../Button/Button";
import { showActionSheetWithOptions } from "../../StateHandlers/ActionSheetStateHandler";

export function GroupConsentPopup() {
  const { conversation } = useConversationContext(["conversation"]);

  const navigation = useNavigation() as NativeStackNavigationProp<
    NavigationParamList,
    "Chats",
    undefined
  >;
  const currentAccount = useCurrentAccount();
  if (!conversation?.isGroup || !conversation?.topic || !currentAccount) {
    throw new Error("This component should only be used for group chats");
  }
  const topic = conversation.topic;

  const styles = useStyles();
  const colorScheme = useColorScheme();
  const { consent, blockGroup, allowGroup } = useGroupConsent(topic);
  const { groupStatus } = useSettingsStore(useSelect(["groupStatus"]));
  const groupStatusForTopic = groupStatus[topic];

  // Determine whether to show the consent window based on various conditions
  const shouldShowConsentWindow =
    conversation &&
    groupStatusForTopic !== "allowed" &&
    consent !== "allowed" &&
    !conversation.pending;

  const onBlock = useCallback(() => {
    showActionSheetWithOptions(
      {
        options: [strings.block, strings.cancel],
        cancelButtonIndex: 1,
        destructiveButtonIndex: 0,
        title: strings.if_you_unblock_group,
        ...actionSheetColors(colorScheme),
      },
      (selectedIndex?: number) => {
        if (selectedIndex === 0 && conversation.peerAddress) {
          blockGroup({
            includeCreator: false,
            includeAddedBy: false,
          });
          navigation.pop();
        }
      }
    );
  }, [blockGroup, colorScheme, conversation.peerAddress, navigation]);

  const onAccept = useCallback(() => {
    allowGroup({
      includeCreator: false,
      includeAddedBy: false,
    });
  }, [allowGroup]);

  if (!shouldShowConsentWindow) {
    // Consent window will not be displayed
    return null;
  }

  return (
    <View style={styles.chatConsentContainer}>
      <Text style={styles.info}>{strings.do_you_trust_this_contact}</Text>
      <View style={styles.buttonsContainer}>
        <Button
          variant="secondary-danger"
          picto="xmark"
          title={strings.block}
          style={styles.cta}
          onPress={onBlock}
        />
        <Button
          variant="secondary"
          picto="checkmark"
          title={strings.accept}
          style={styles.cta}
          onPress={onAccept}
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