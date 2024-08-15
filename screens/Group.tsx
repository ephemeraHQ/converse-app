import { invalidateGroupConsentQuery } from "@queries/useGroupConsentQuery";
import { invalidateGroupDescriptionQuery } from "@queries/useGroupDescriptionQuery";
import { invalidateGroupMembersQuery } from "@queries/useGroupMembersQuery";
import { invalidateGroupNameQuery } from "@queries/useGroupNameQuery";
import { invalidateGroupPhotoQuery } from "@queries/useGroupPhotoQuery";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  backgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import React, { useCallback, useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NavigationParamList } from "./Navigation/Navigation";
import { GroupPendingRequestsTable } from "../containers/GroupPendingRequestsTable";
import { GroupScreenAddition } from "../containers/GroupScreenAddition";
import { GroupScreenConsentTable } from "../containers/GroupScreenConsentTable";
import { GroupScreenDescription } from "../containers/GroupScreenDescription";
import { GroupScreenImage } from "../containers/GroupScreenImage";
import { GroupScreenMembersTable } from "../containers/GroupScreenMembersTable";
import { GroupScreenName } from "../containers/GroupScreenName";
import { useChatStore, useCurrentAccount } from "../data/store/accountsStore";
import { XmtpGroupConversation } from "../data/store/chatStore";
import { useGroupMembers } from "../hooks/useGroupMembers";
import {
  getAddressIsAdmin,
  getAddressIsSuperAdmin,
} from "../utils/groupUtils/adminUtils";

export default function GroupScreen({
  route,
}: NativeStackScreenProps<NavigationParamList, "Group">) {
  const styles = useStyles();
  const group = useChatStore(
    (s) => s.conversations[route.params.topic]
  ) as XmtpGroupConversation;
  const insets = useSafeAreaInsets();
  const currentAccount = useCurrentAccount() as string;
  const topic = group.topic;

  const { members } = useGroupMembers(topic);
  const currentAccountIsAdmin = useMemo(
    () => getAddressIsAdmin(members, currentAccount),
    [currentAccount, members]
  );

  useFocusEffect(
    useCallback(() => {
      // Favoring invalidating individual queries
      invalidateGroupNameQuery(currentAccount, topic);
      invalidateGroupDescriptionQuery(currentAccount, topic);
      invalidateGroupPhotoQuery(currentAccount, topic);
      invalidateGroupMembersQuery(currentAccount, topic);
      invalidateGroupConsentQuery(currentAccount, topic);
    }, [currentAccount, topic])
  );

  const currentAccountIsSuperAdmin = useMemo(
    () => getAddressIsSuperAdmin(members, currentAccount),
    [currentAccount, members]
  );

  return (
    <ScrollView
      style={styles.group}
      contentContainerStyle={styles.groupContent}
    >
      <GroupScreenImage
        currentAccountIsAdmin={currentAccountIsAdmin}
        currentAccountIsSuperAdmin={currentAccountIsSuperAdmin}
        topic={topic}
      />
      <GroupScreenName
        currentAccountIsAdmin={currentAccountIsAdmin}
        currentAccountIsSuperAdmin={currentAccountIsSuperAdmin}
        topic={topic}
      />
      <GroupScreenDescription
        currentAccountIsAdmin={currentAccountIsAdmin}
        currentAccountIsSuperAdmin={currentAccountIsSuperAdmin}
        topic={topic}
      />
      <GroupScreenAddition
        topic={topic}
        currentAccountIsAdmin={currentAccountIsAdmin}
        currentAccountIsSuperAdmin={currentAccountIsSuperAdmin}
      />
      <GroupPendingRequestsTable topic={topic} />
      <GroupScreenMembersTable
        topic={topic}
        groupPermissionLevel={group.groupPermissionLevel}
      />
      <GroupScreenConsentTable topic={topic} />
      <View style={{ height: insets.bottom }} />
    </ScrollView>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    description: {
      color: textPrimaryColor(colorScheme),
      fontSize: 13,
      textAlign: "center",
      marginTop: 13,
    },
    group: {
      backgroundColor: backgroundColor(colorScheme),
    },
    groupContent: {
      paddingHorizontal:
        Platform.OS === "ios" || Platform.OS === "web" ? 18 : 0,
    },
    tableViewRight: {
      flexDirection: "row",
      alignItems: "center",
    },
    adminText: {
      fontSize: 17,
      color: textSecondaryColor(colorScheme),
    },
  });
};
