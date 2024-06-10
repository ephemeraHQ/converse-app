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
  const currentAccountIsAdmin = useMemo(() => {
    return group.groupAdmins?.some?.(
      (admin) => admin.toLowerCase() === currentAccount.toLowerCase()
    );
  }, [currentAccount, group.groupAdmins]);

  const currentAccountIsSuperAdmin = useMemo(() => {
    return group.groupSuperAdmins?.some(
      (admin) => admin.toLowerCase() === currentAccount.toLowerCase()
    );
  }, [currentAccount, group.groupSuperAdmins]);

  const tableViewItems = useMemo(() => {
    const items: TableViewItemType[] = [];

    const groupMembers = [...group.groupMembers];
    // Sorting group members to show admins & me first
    groupMembers.sort((a, b) => {
      const aIsAdmin = group.groupAdmins?.some?.(
        (admin) => admin.toLowerCase() === a.toLowerCase()
      );
      const aIsSuperAdmin = group.groupSuperAdmins?.some(
        (admin) => admin.toLowerCase() === a.toLowerCase()
      );
      const bIsAdmin = group.groupAdmins?.some?.(
        (admin) => admin.toLowerCase() === b.toLowerCase()
      );
      const bIsSuperAdmin = group.groupSuperAdmins?.some(
        (admin) => admin.toLowerCase() === b.toLowerCase()
      );
      if (aIsSuperAdmin && !bIsSuperAdmin) {
        return -1;
      }
      if (aIsAdmin && !bIsAdmin) {
        return -1;
      }
      if (a.toLowerCase() === currentAccount.toLowerCase()) {
        return -1;
      }
      return 0;
    });
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
      const isSuperAdmin = group.groupSuperAdmins?.some(
        (admin) => admin.toLowerCase() === a.toLowerCase()
      );
      const isAdmin = group.groupAdmins?.some(
        (admin) => admin.toLowerCase() === a.toLowerCase()
      );
      const isCurrentUser = a.toLowerCase() === currentAccount.toLowerCase();
      const preferredName = getPreferredName(profiles[a]?.socials, a);
      items.push({
        id: a,
        title: `${preferredName}${isCurrentUser ? " (you)" : ""}`,
        action: () => {
          const canRemove =
            !isCurrentUser &&
            ((currentAccountIsAdmin && !isSuperAdmin) ||
              currentAccountIsSuperAdmin ||
              group.groupPermissionLevel === "all_members");
          const canPromoteToSuperAdmin =
            currentAccountIsSuperAdmin && !isSuperAdmin && !isCurrentUser;
          const canPromoteToAdmin =
            !isCurrentUser &&
            currentAccountIsSuperAdmin &&
            !isAdmin &&
            !isSuperAdmin;
          const canRevokeAdmin =
            !isCurrentUser &&
            currentAccountIsSuperAdmin &&
            isAdmin &&
            !isSuperAdmin;
          const canRevokeSuperAdmin =
            !isCurrentUser && currentAccountIsSuperAdmin && isSuperAdmin;
          const options = ["Profile page"];
          let cancelButtonIndex = 1;
          let promoteAdminIndex: number | undefined = undefined;
          if (canPromoteToAdmin) {
            promoteAdminIndex = options.length;
            options.push("Promote to admin");
            cancelButtonIndex++;
          }
          let promoteSuperAdminIndex: number | undefined = undefined;
          if (canPromoteToSuperAdmin) {
            promoteSuperAdminIndex = options.length;
            options.push("Promote to super admin");
            cancelButtonIndex++;
          }
          let revokeAdminIndex: number | undefined = undefined;
          if (canRevokeAdmin) {
            revokeAdminIndex = options.length;
            options.push("Revoke admin");
            cancelButtonIndex++;
          }
          let revokeSuperAdminIndex: number | undefined = undefined;
          if (canRevokeSuperAdmin) {
            revokeSuperAdminIndex = options.length;
            options.push("Revoke super admin");
            cancelButtonIndex++;
          }
          let removeIndex: number | undefined = undefined;
          if (canRemove) {
            removeIndex = options.length;
            options.push("Remove from group");
            cancelButtonIndex++;
          }
          options.push("Cancel");
          const destructiveButtonIndex = canRemove
            ? options.length - 2
            : undefined;
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
                    fromGroup: true,
                  });
                  break;
                case promoteSuperAdminIndex:
                  if (!canPromoteToSuperAdmin) {
                    return;
                  }
                  console.log("Promoting super admin...");
                  try {
                    await promoteMemberToSuperAdmin(
                      currentAccount,
                      group.topic,
                      a
                    );
                  } catch (e) {
                    console.error(e);
                    Alert.alert("An error occurred");
                  }
                  break;
                case revokeSuperAdminIndex:
                  console.log("Revoking super admin...");
                  if (!canRevokeSuperAdmin) {
                    return;
                  }
                  try {
                    await revokeSuperAdminAccess(
                      currentAccount,
                      group.topic,
                      a
                    );
                  } catch (e) {
                    console.error(e);
                    Alert.alert("An error occurred");
                  }
                  break;
                case promoteAdminIndex:
                  console.log("Promoting member...");
                  if (!canPromoteToAdmin) {
                    return;
                  }
                  try {
                    await promoteMemberToAdmin(currentAccount, group.topic, a);
                  } catch (e) {
                    console.error(e);
                    Alert.alert("An error occurred");
                  }
                  break;
                case revokeAdminIndex:
                  console.log("Revoking admin...");
                  if (!canRevokeAdmin) {
                    return;
                  }
                  try {
                    await revokeAdminAccess(currentAccount, group.topic, a);
                  } catch (e) {
                    console.error(e);
                    Alert.alert("An error occurred");
                  }
                  break;
                case removeIndex:
                  console.log("Removing member...");
                  if (!canRemove) {
                    return;
                  }
                  try {
                    await removeMembersFromGroup(currentAccount, group.topic, [
                      a,
                    ]);
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
    group.groupAdmins,
    group.groupMembers,
    group.groupPermissionLevel,
    group.groupSuperAdmins,
    group.topic,
    profiles,
    styles.adminText,
    styles.tableViewRight,
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
