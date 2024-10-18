import { useSelect } from "@data/store/storeHelpers";
import { useGroupConsent } from "@hooks/useGroupConsent";
import { useGroupCreator } from "@hooks/useGroupCreator";
import { useGroupMembers } from "@hooks/useGroupMembers";
import { translate } from "@i18n";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { backgroundColor, textPrimaryColor } from "@styles/colors";
import { groupRemoveRestoreHandler } from "@utils/groupUtils/groupActionHandlers";
import { getGroupIdFromTopic } from "@utils/groupUtils/groupId";
import React, { useCallback, useMemo } from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";

import {
  useCurrentAccount,
  useSettingsStore,
} from "../../../data/store/accountsStore";
import { Button } from "../../../design-system/Button/Button";
import { NavigationParamList } from "../../../screens/Navigation/Navigation";
import { useConversationContext } from "../../../utils/conversation";

export function GroupConsentPopup() {
  const conversation = useConversationContext("conversation");

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
  const { groupCreator } = useGroupCreator(topic);
  const { groupStatus } = useSettingsStore(useSelect(["groupStatus"]));
  const { members } = useGroupMembers(topic);
  const groupId = getGroupIdFromTopic(topic);
  const groupStatusForTopic = groupStatus[groupId];

  const isCreator = useMemo(() => {
    if (!members || !currentAccount) {
      return true;
    }
    return groupCreator === members?.byAddress[currentAccount];
  }, [currentAccount, groupCreator, members]);

  // Determine whether to show the consent window based on various conditions
  const shouldShowConsentWindow =
    conversation &&
    groupStatusForTopic !== "allowed" &&
    consent !== "allowed" &&
    !conversation.pending &&
    !isCreator;

  const onBlock = useCallback(() => {
    groupRemoveRestoreHandler(
      "unknown", // To display "Remove & Block inviter"
      colorScheme,
      conversation.groupName,
      allowGroup,
      blockGroup
    )((success: boolean) => {
      if (success) {
        navigation.pop();
      }
      // If not successful, do nothing (user canceled)
    });
  }, [blockGroup, allowGroup, conversation.groupName, colorScheme, navigation]);

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
      <Text style={styles.info}>
        {translate("do_you_want_to_join_this_group")}
      </Text>
      <View style={styles.buttonsContainer}>
        <Button
          variant="text"
          title={translate("decline")}
          style={[styles.cta, styles.blockCta]}
          onPress={onBlock}
        />
        <Button
          variant="outline"
          picto="checkmark"
          title={translate("join_this_group")}
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
    blockCta: {
      borderWidth: 1,
      borderRadius: 100,
      paddingHorizontal: 15,
      paddingVertical: 7,
      padding: 5,
      borderColor: textPrimaryColor(colorScheme),
    },
  });
};
