import { showActionSheetWithOptions } from "@components/StateHandlers/ActionSheetStateHandler";
import { TableViewPicto } from "@components/TableView/TableViewImage";
import { useCurrentAccount, useProfilesStore } from "@data/store/accountsStore";
import { useGroupMembers } from "@hooks/useGroupMembers";
import { translate } from "@i18n";
import { actionSheetColors, textSecondaryColor } from "@styles/colors";
import {
  getAccountIsAdmin,
  getAccountIsSuperAdmin,
  getAddressIsSuperAdmin,
} from "@utils/groupUtils/adminUtils";
import { getGroupMemberActions } from "@utils/groupUtils/getGroupMemberActions";
import { sortGroupMembersByAdminStatus } from "@utils/groupUtils/sortGroupMembersByAdminStatus";
import logger from "@utils/logger";
import { navigate } from "@utils/navigation";
import { getPreferredName, getProfile } from "@utils/profile";
import { FC, memo, useMemo } from "react";
import { StyleSheet, Text, View, useColorScheme } from "react-native";

import { useGroupPermissionPolicyQuery } from "@queries/useGroupPermissionPolicyQuery";
import type { GroupWithCodecsType } from "@utils/xmtpRN/client";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import TableView, {
  TableViewItemType,
} from "../components/TableView/TableView";
import { captureErrorWithFriendlyToast } from "@/utils/capture-error";

type GroupScreenMembersTableProps = {
  topic: ConversationTopic | undefined;
  group: GroupWithCodecsType | undefined | null;
};

export const GroupScreenMembersTable: FC<GroupScreenMembersTableProps> = memo(
  ({ topic, group }) => {
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
    } = useGroupMembers((topic ?? group?.topic)!);
    const { data: groupPermissionPolicy } = useGroupPermissionPolicyQuery(
      currentAccount,
      (topic ?? group?.topic)!
    );
    const profiles = useProfilesStore((s) => s.profiles);

    const currentAccountIsSuperAdmin = useMemo(
      () => getAddressIsSuperAdmin(members, currentAccount),
      [currentAccount, members]
    );

    const tableViewItems = useMemo(() => {
      const items: TableViewItemType[] = [];

      const groupMembers = sortGroupMembersByAdminStatus(
        members,
        currentAccount
      );
      groupMembers.forEach((a) => {
        const isSuperAdmin = getAccountIsSuperAdmin(members, a.inboxId);
        const isAdmin = getAccountIsAdmin(members, a.inboxId);
        const isCurrentUser =
          a.address.toLowerCase() === currentAccount.toLowerCase();
        const preferredName = getPreferredName(
          getProfile(a.address, profiles)?.socials,
          a.address
        );
        items.push({
          id: a.inboxId,
          title: `${preferredName}${isCurrentUser ? translate("you_parentheses") : ""}`,
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
              groupPermissionPolicy,
              isCurrentUser,
              isSuperAdmin,
              isAdmin,
              currentAccountIsSuperAdmin
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
                      captureErrorWithFriendlyToast(e);
                    }
                    break;
                  case revokeSuperAdminIndex:
                    logger.debug("Revoking super admin...");
                    try {
                      await revokeSuperAdmin(a.inboxId);
                    } catch (e) {
                      logger.error(e);
                      captureErrorWithFriendlyToast(e);
                    }
                    break;
                  case promoteAdminIndex:
                    logger.debug("Promoting member...");
                    try {
                      await promoteToAdmin(a.inboxId);
                    } catch (e) {
                      logger.error(e);
                      captureErrorWithFriendlyToast(e);
                    }
                    break;
                  case revokeAdminIndex:
                    logger.debug("Revoking admin...");
                    try {
                      await revokeAdmin(a.inboxId);
                    } catch (e) {
                      logger.error(e);
                      captureErrorWithFriendlyToast(e);
                    }
                    break;
                  case removeIndex:
                    logger.debug("Removing member...");
                    try {
                      await removeMember([a.inboxId]);
                    } catch (e) {
                      logger.error(e);
                      captureErrorWithFriendlyToast(e);
                    }
                    break;
                  default:
                }
              }
            );
          },
          rightView: (
            <View style={styles.tableViewRight}>
              {isSuperAdmin && (
                <Text style={styles.adminText}>
                  {translate("group_screen_member_actions.super_admin")}
                </Text>
              )}
              {isAdmin && !isSuperAdmin && (
                <Text style={styles.adminText}>
                  {translate("group_screen_member_actions.admin")}
                </Text>
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
      currentAccountIsSuperAdmin,
      groupPermissionPolicy,
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
  }
);

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
