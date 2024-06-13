import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { showActionSheetWithOptions } from "../components/StateHandlers/ActionSheetStateHandler";
import TableView, {
  TableViewItemType,
} from "../components/TableView/TableView";
import { TableViewPicto } from "../components/TableView/TableViewImage";
import {
  useChatStore,
  useCurrentAccount,
  useProfilesStore,
} from "../data/store/accountsStore";
import { XmtpGroupConversation } from "../data/store/chatStore";
import {
  backgroundColor,
  primaryColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../utils/colors";
import {
  getAccountIsAdmin,
  getAccountIsSuperAdmin,
} from "../utils/groupUtils/adminUtils";
import { getGroupMemberActions } from "../utils/groupUtils/getGroupMemberActions";
import { sortGroupMembersByAdminStatus } from "../utils/groupUtils/sortGroupMembersByAdminStatus";
import { navigate } from "../utils/navigation";
import { getPreferredName } from "../utils/profile";
import { conversationName } from "../utils/str";
import {
  promoteMemberToAdmin,
  promoteMemberToSuperAdmin,
  removeMembersFromGroup,
  revokeAdminAccess,
  revokeSuperAdminAccess,
  updateGroupName,
} from "../utils/xmtpRN/conversations";
import { NavigationParamList } from "./Navigation/Navigation";

export default function GroupScreen({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "Group">) {
  const styles = useStyles();
  const group = useChatStore(
    (s) => s.conversations[route.params.topic]
  ) as XmtpGroupConversation;
  const insets = useSafeAreaInsets();
  const profiles = useProfilesStore((s) => s.profiles);
  const colorScheme = useColorScheme();
  const currentAccount = useCurrentAccount() as string;
  const topic = group.topic;
  const currentAccountIsAdmin = useMemo(() => {
    return (
      getAccountIsSuperAdmin(group, currentAccount) ||
      getAccountIsAdmin(group, currentAccount)
    );
  }, [currentAccount, group]);

  const currentAccountIsSuperAdmin = useMemo(() => {
    return getAccountIsSuperAdmin(group, currentAccount);
  }, [currentAccount, group]);

  const tableViewItems = useMemo(() => {
    const items: TableViewItemType[] = [];

    const groupMembers = sortGroupMembersByAdminStatus(group, currentAccount);
    if (currentAccountIsAdmin || group.groupPermissionLevel === "all_members") {
      items.push({
        id: "admin",
        title: "Add members",
        titleColor: primaryColor(colorScheme),
        action: () => {
          navigate("NewConversation", { addingToGroupTopic: group.topic });
        },
      });
    }
    groupMembers.forEach((a) => {
      const isSuperAdmin = getAccountIsSuperAdmin(group, a);
      const isAdmin = getAccountIsAdmin(group, a);
      const isCurrentUser = a.toLowerCase() === currentAccount.toLowerCase();
      const preferredName = getPreferredName(profiles[a]?.socials, a);
      items.push({
        id: a,
        title: `${preferredName}${isCurrentUser ? " (you)" : ""}`,
        action: () => {
          const {
            options,
            cancelButtonIndex,
            promoteAdminIndex,
            promoteSuperAdminIndex,
            revokeAdminIndex,
            revokeSuperAdminIndex,
            removeIndex,
            destructiveButtonIndex,
          } = getGroupMemberActions(
            group.groupPermissionLevel,
            isCurrentUser,
            isSuperAdmin,
            isAdmin,
            currentAccountIsSuperAdmin,
            currentAccountIsAdmin
          );
          showActionSheetWithOptions(
            {
              options,
              cancelButtonIndex,
              destructiveButtonIndex,
              title: preferredName,
            },
            async (selectedIndex?: number) => {
              switch (selectedIndex) {
                case 0:
                  navigate("Profile", {
                    address: a,
                    fromGroupTopic: topic,
                  });
                  break;
                case promoteSuperAdminIndex:
                  console.log("Promoting super admin...");
                  try {
                    await promoteMemberToSuperAdmin(currentAccount, topic, a);
                  } catch (e) {
                    console.error(e);
                    Alert.alert("An error occurred");
                  }
                  break;
                case revokeSuperAdminIndex:
                  console.log("Revoking super admin...");
                  try {
                    await revokeSuperAdminAccess(currentAccount, topic, a);
                  } catch (e) {
                    console.error(e);
                    Alert.alert("An error occurred");
                  }
                  break;
                case promoteAdminIndex:
                  console.log("Promoting member...");
                  try {
                    await promoteMemberToAdmin(currentAccount, topic, a);
                  } catch (e) {
                    console.error(e);
                    Alert.alert("An error occurred");
                  }
                  break;
                case revokeAdminIndex:
                  console.log("Revoking admin...");
                  try {
                    await revokeAdminAccess(currentAccount, topic, a);
                  } catch (e) {
                    console.error(e);
                    Alert.alert("An error occurred");
                  }
                  break;
                case removeIndex:
                  console.log("Removing member...");
                  try {
                    await removeMembersFromGroup(currentAccount, topic, [a]);
                  } catch (e) {
                    console.error(e);
                    Alert.alert("An error occurred");
                  }
                  break;
                default:
              }
            }
          );
        },
        rightView: (
          <View style={styles.tableViewRight}>
            {isSuperAdmin && <Text style={styles.adminText}>Super Admin</Text>}
            {isAdmin && !isSuperAdmin && (
              <Text style={styles.adminText}>Admin</Text>
            )}
            <TableViewPicto
              symbol="chevron.right"
              color={textSecondaryColor(colorScheme)}
            />
          </View>
        ),
      });
    });
    return items;
  }, [
    colorScheme,
    currentAccount,
    currentAccountIsAdmin,
    currentAccountIsSuperAdmin,
    group,
    profiles,
    styles.adminText,
    styles.tableViewRight,
    topic,
  ]);

  const canEditGroupName =
    currentAccountIsAdmin ||
    currentAccountIsSuperAdmin ||
    group.groupPermissionLevel === "all_members";
  const [editedName, setEditedName] = useState(conversationName(group));
  const handleNameChange = useCallback(async () => {
    try {
      await updateGroupName(currentAccount, group.topic, editedName);
    } catch (e) {
      console.error(e);
      Alert.alert("An error occurred");
    }
  }, [currentAccount, editedName, group.topic]);

  return (
    <ScrollView
      style={styles.group}
      contentContainerStyle={styles.groupContent}
    >
      {canEditGroupName ? (
        <TextInput
          style={styles.title}
          defaultValue={conversationName(group)}
          value={editedName}
          onChangeText={setEditedName}
          blurOnSubmit
          onSubmitEditing={handleNameChange}
          returnKeyType="done"
        />
      ) : (
        <Text style={styles.title}>{conversationName(group)}</Text>
      )}
      <TableView items={tableViewItems} title="MEMBERS" />
      <View style={{ height: insets.bottom }} />
    </ScrollView>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    title: {
      color: textPrimaryColor(colorScheme),
      fontSize: 34,
      fontWeight: "bold",
      textAlign: "center",
      marginTop: 23,
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
