import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useMemo } from "react";
import {
  StyleSheet,
  ScrollView,
  useColorScheme,
  Platform,
  View,
  Text,
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
import { removeMembersFromGroup } from "../utils/xmtpRN/conversations";
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
  const currentAccountIsAdmin = group.groupAdmins?.some(
    (admin) => admin.toLowerCase() === currentAccount.toLowerCase()
  );
  const tableViewItems = useMemo(() => {
    const items: TableViewItemType[] = [];
    const groupMembers = [...group.groupMembers];
    // Sorting group members to show admins & me first
    groupMembers.sort((a, b) => {
      const isAdmin = group.groupAdmins?.some(
        (admin) => admin.toLowerCase() === a.toLowerCase()
      );
      if (isAdmin) {
        return -1;
      }
      if (a.toLowerCase() === currentAccount.toLowerCase()) {
        return -1;
      }
      return 0;
    });
    if (
      currentAccountIsAdmin ||
      group.groupPermissionLevel === "everyone_admin"
    ) {
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
            currentAccountIsAdmin ||
            group.groupPermissionLevel === "everyone_admin";
          const options = ["Profile page"];
          if (canRemove) {
            options.push("Remove from group");
          }
          options.push("Cancel");
          const cancelButtonIndex = canRemove ? 2 : 1;
          const destructiveButtonIndex = canRemove ? 1 : undefined;
          showActionSheetWithOptions(
            {
              options,
              cancelButtonIndex,
              destructiveButtonIndex,
              title: preferredName,
            },
            (selectedIndex?: number) => {
              if (canRemove && selectedIndex === destructiveButtonIndex) {
                removeMembersFromGroup(currentAccount, group.topic, [a]);
              } else if (
                selectedIndex !== undefined &&
                selectedIndex !== destructiveButtonIndex &&
                selectedIndex !== cancelButtonIndex
              ) {
                navigate("Profile", {
                  address: a,
                  fromGroup: true,
                });
              }
            }
          );
        },
        rightView: (
          <View style={styles.tableViewRight}>
            {isAdmin && <Text style={styles.adminText}>Admin</Text>}
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
    group,
    profiles,
    styles.adminText,
    styles.tableViewRight,
  ]);

  return (
    <ScrollView
      style={styles.group}
      contentContainerStyle={styles.groupContent}
    >
      <Text style={styles.title}>{conversationName(group)}</Text>
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
