import { showActionSheetWithOptions } from "@components/StateHandlers/ActionSheetStateHandler";
import { TableViewPicto } from "@components/TableView/TableViewImage";
import { useCurrentAccount, useProfilesStore } from "@data/store/accountsStore";
import { useGroupMembers } from "@hooks/useGroupMembers";
import { translate } from "@i18n/translate";
import { actionSheetColors, textSecondaryColor } from "@styles/colors";
import {
  getAccountIsAdmin,
  getAccountIsSuperAdmin,
  getAddressIsAdmin,
  getAddressIsSuperAdmin,
} from "@utils/groupUtils/adminUtils";
import { getGroupMemberActions } from "@utils/groupUtils/getGroupMemberActions";
import { sortGroupMembersByAdminStatus } from "@utils/groupUtils/sortGroupMembersByAdminStatus";
import logger from "@utils/logger";
import { navigate } from "@utils/navigation";
import { getPreferredName } from "@utils/profile";
import { FC, useMemo } from "react";
import { Alert, StyleSheet, Text, useColorScheme, View } from "react-native";

import TableView, {
  TableViewItemType,
} from "../components/TableView/TableView";

interface GroupScreenMembersTableProps {
  topic: string;
  groupPermissionLevel: string;
}

export const GroupScreenMembersTable: FC<GroupScreenMembersTableProps> = ({
  topic,
  groupPermissionLevel,
}) => {
  const colorScheme = useColorScheme();
  const currentAccount = useCurrentAccount() as string;
  const styles = useStyles();
  const {
    members,
    promoteToSuperAdmin,
    promoteToAdmin,
    revokeAdmin,
    revokeSuperAdmin,
    removeMember,
  } = useGroupMembers(topic);
  const profiles = useProfilesStore((s) => s.profiles);
  const currentAccountIsAdmin = useMemo(
    () => getAddressIsAdmin(members, currentAccount),
    [currentAccount, members]
  );
  const currentAccountIsSuperAdmin = useMemo(
    () => getAddressIsSuperAdmin(members, currentAccount),
    [currentAccount, members]
  );

  const tableViewItems = useMemo(() => {
    const items: TableViewItemType[] = [];

    const groupMembers = sortGroupMembersByAdminStatus(members, currentAccount);
    groupMembers.forEach((a) => {
      const isSuperAdmin = getAccountIsSuperAdmin(members, a.inboxId);
      const isAdmin = getAccountIsAdmin(members, a.inboxId);
      const isCurrentUser =
        a.address.toLowerCase() === currentAccount.toLowerCase();
      const preferredName = getPreferredName(
        profiles[a.address]?.socials,
        a.address
      );
      items.push({
        id: a.inboxId,
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
            groupPermissionLevel,
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
              ...actionSheetColors(colorScheme),
            },
            async (selectedIndex?: number) => {
              switch (selectedIndex) {
                case 0:
                  navigate("Profile", {
                    address: a.address,
                    fromGroupTopic: topic,
                  });
                  break;
                case promoteSuperAdminIndex:
                  logger.debug("Promoting super admin...");
                  try {
                    await promoteToSuperAdmin(a.inboxId);
                  } catch (e) {
                    logger.error(e);
                    Alert.alert("An error occurred");
                  }
                  break;
                case revokeSuperAdminIndex:
                  logger.debug("Revoking super admin...");
                  try {
                    await revokeSuperAdmin(a.inboxId);
                  } catch (e) {
                    logger.error(e);
                    Alert.alert("An error occurred");
                  }
                  break;
                case promoteAdminIndex:
                  logger.debug("Promoting member...");
                  try {
                    await promoteToAdmin(a.inboxId);
                  } catch (e) {
                    logger.error(e);
                    Alert.alert("An error occurred");
                  }
                  break;
                case revokeAdminIndex:
                  logger.debug("Revoking admin...");
                  try {
                    await revokeAdmin(a.inboxId);
                  } catch (e) {
                    logger.error(e);
                    Alert.alert("An error occurred");
                  }
                  break;
                case removeIndex:
                  logger.debug("Removing member...");
                  try {
                    await removeMember([a.inboxId]);
                  } catch (e) {
                    logger.error(e);
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
    groupPermissionLevel,
    members,
    profiles,
    promoteToAdmin,
    promoteToSuperAdmin,
    removeMember,
    revokeAdmin,
    revokeSuperAdmin,
    styles.adminText,
    styles.tableViewRight,
    topic,
  ]);

  return (
    <TableView items={tableViewItems} title={translate("members_title")} />
  );
};

const useStyles = () => {
  const colorScheme = useColorScheme();

  return StyleSheet.create({
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
