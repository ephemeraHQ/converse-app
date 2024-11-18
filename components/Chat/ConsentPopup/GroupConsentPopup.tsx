import { useSelect } from "@data/store/storeHelpers";
import { Button } from "@design-system/Button/Button";
import { useGroupConsent } from "@hooks/useGroupConsent";
import { useGroupCreator } from "@hooks/useGroupCreator";
import { useGroupMembers } from "@hooks/useGroupMembers";
import { translate } from "@i18n";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { backgroundColor, textPrimaryColor } from "@styles/colors";
import { groupRemoveRestoreHandler } from "@utils/groupUtils/groupActionHandlers";
import { getV3IdFromTopic } from "@utils/groupUtils/groupId";
import React, { useCallback, useMemo } from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";

import {
  useCurrentAccount,
  useSettingsStore,
} from "../../../data/store/accountsStore";
import { NavigationParamList } from "../../../screens/Navigation/Navigation";
import { useConversationContext } from "../../../utils/conversation";
import { GroupWithCodecsType } from "@utils/xmtpRN/client";

type GroupConsentPopupProps = {
  group: GroupWithCodecsType;
};

export function GroupConsentPopup({ group }: GroupConsentPopupProps) {
  const navigation = useNavigation() as NativeStackNavigationProp<
    NavigationParamList,
    "Chats",
    undefined
  >;

  const topic = group.topic;
  const isAllowed = group.state === "allowed";

  const styles = useStyles();
  const colorScheme = useColorScheme();
  const { blockGroup, allowGroup } = useGroupConsent(topic);

  // Determine whether to show the consent window based on various conditions
  const shouldShowConsentWindow = group && !isAllowed;

  const onBlock = useCallback(async () => {
    const name = await group.groupName();
    groupRemoveRestoreHandler(
      "unknown", // To display "Remove & Block inviter"
      colorScheme,
      name,
      allowGroup,
      blockGroup
    )((success: boolean) => {
      if (success) {
        navigation.pop();
      }
      // If not successful, do nothing (user canceled)
    });
  }, [group, colorScheme, allowGroup, blockGroup, navigation]);

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
          text={translate("decline")}
          style={[styles.cta, styles.blockCta]}
          onPress={onBlock}
        />
        <Button
          variant="fill"
          picto="checkmark"
          text={translate("join_this_group")}
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
