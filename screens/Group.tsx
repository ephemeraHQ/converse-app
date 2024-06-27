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
import { List } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Avatar from "../components/Avatar";
import Button from "../components/Button/Button";
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
import { useGroupConsent } from "../hooks/useGroupConsent";
import { useGroupMembers } from "../hooks/useGroupMembers";
import { useGroupName } from "../hooks/useGroupName";
import { useGroupPhoto } from "../hooks/useGroupPhoto";
import { usePhotoSelect } from "../hooks/usePhotoSelect";
import { uploadFile } from "../utils/attachment";
import {
  backgroundColor,
  dangerColor,
  primaryColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../utils/colors";
import {
  getAccountIsAdmin,
  getAccountIsSuperAdmin,
  getAddressIsAdmin,
  getAddressIsSuperAdmin,
} from "../utils/groupUtils/adminUtils";
import { getGroupMemberActions } from "../utils/groupUtils/getGroupMemberActions";
import { sortGroupMembersByAdminStatus } from "../utils/groupUtils/sortGroupMembersByAdminStatus";
import { navigate } from "../utils/navigation";
import { getPreferredName } from "../utils/profile";
import { formatGroupName } from "../utils/str";
import { NavigationParamList } from "./Navigation/Navigation";

export default function GroupScreen({
  route,
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
  const { groupName, setGroupName } = useGroupName(topic);

  const { groupPhoto, setGroupPhoto } = useGroupPhoto(topic);
  const { consent, allowGroup, blockGroup } = useGroupConsent(topic);
  const onPhotoChange = useCallback(
    (newImageUrl: string) => {
      uploadFile({
        account: currentAccount,
        filePath: newImageUrl,
        contentType: "image/jpeg",
      }).then((url) => {
        setGroupPhoto(url);
      });
    },
    [currentAccount, setGroupPhoto]
  );
  const { addPhoto: addGroupPhoto, photo: localGroupPhoto } = usePhotoSelect({
    initialPhoto: groupPhoto,
    onPhotoAdd: onPhotoChange,
  });

  const {
    members,
    promoteToSuperAdmin,
    promoteToAdmin,
    revokeAdmin,
    revokeSuperAdmin,
    removeMember,
  } = useGroupMembers(topic);
  const currentAccountIsAdmin = useMemo(
    () => getAddressIsAdmin(members, currentAccount),
    [currentAccount, members]
  );

  const currentAccountIsSuperAdmin = useMemo(
    () => getAddressIsSuperAdmin(members, currentAccount),
    [currentAccount, members]
  );
  const formattedGroupName = formatGroupName(topic, groupName);

  const tableViewItems = useMemo(() => {
    const items: TableViewItemType[] = [];

    const groupMembers = sortGroupMembersByAdminStatus(members, currentAccount);
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
                    address: a.address,
                    fromGroupTopic: topic,
                  });
                  break;
                case promoteSuperAdminIndex:
                  console.log("Promoting super admin...");
                  try {
                    await promoteToSuperAdmin(a.inboxId);
                  } catch (e) {
                    console.error(e);
                    Alert.alert("An error occurred");
                  }
                  break;
                case revokeSuperAdminIndex:
                  console.log("Revoking super admin...");
                  try {
                    await revokeSuperAdmin(a.inboxId);
                  } catch (e) {
                    console.error(e);
                    Alert.alert("An error occurred");
                  }
                  break;
                case promoteAdminIndex:
                  console.log("Promoting member...");
                  try {
                    await promoteToAdmin(a.inboxId);
                  } catch (e) {
                    console.error(e);
                    Alert.alert("An error occurred");
                  }
                  break;
                case revokeAdminIndex:
                  console.log("Revoking admin...");
                  try {
                    await revokeAdmin(a.inboxId);
                  } catch (e) {
                    console.error(e);
                    Alert.alert("An error occurred");
                  }
                  break;
                case removeIndex:
                  console.log("Removing member...");
                  try {
                    await removeMember([a.inboxId]);
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
    group.groupPermissionLevel,
    group.topic,
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

  const consentTableViewItems = useMemo(() => {
    const items: TableViewItemType[] = [];
    if (consent !== "allowed") {
      items.push({
        id: "allow_group",
        title: "Allow group",
        titleColor: primaryColor(colorScheme),
        action: () => {
          allowGroup();
        },
      });
    }
    if (consent !== "denied") {
      items.push({
        id: "block_group",
        title: "Block group",
        titleColor: dangerColor(colorScheme),
        action: () => {
          blockGroup();
        },
      });
    }

    return items;
  }, [consent, allowGroup, blockGroup, colorScheme]);

  const canEditGroupMetadata =
    currentAccountIsAdmin ||
    currentAccountIsSuperAdmin ||
    group.groupPermissionLevel === "all_members";
  const [editedName, setEditedName] = useState(formattedGroupName);
  const handleNameChange = useCallback(async () => {
    try {
      await setGroupName(editedName);
    } catch (e) {
      console.error(e);
      Alert.alert("An error occurred");
    }
  }, [editedName, setGroupName]);

  return (
    <ScrollView
      style={styles.group}
      contentContainerStyle={styles.groupContent}
    >
      <List.Section>
        <View style={{ alignItems: "center" }}>
          <Avatar uri={localGroupPhoto} style={styles.avatar} color={false} />
          {canEditGroupMetadata && (
            <Button
              variant="text"
              title={
                groupPhoto ? "Change profile picture" : "Add profile picture"
              }
              textStyle={{ fontWeight: "500" }}
              onPress={addGroupPhoto}
            />
          )}
        </View>
      </List.Section>
      {canEditGroupMetadata ? (
        <TextInput
          style={styles.title}
          defaultValue={formattedGroupName}
          value={editedName}
          onChangeText={setEditedName}
          blurOnSubmit
          onSubmitEditing={handleNameChange}
          returnKeyType="done"
        />
      ) : (
        <Text style={styles.title} ellipsizeMode="tail">
          {formattedGroupName}
        </Text>
      )}
      <TableView items={tableViewItems} title="MEMBERS" />
      <TableView items={consentTableViewItems} title="CONSENT" />
      <View style={{ height: insets.bottom }} />
    </ScrollView>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    avatar: {
      marginBottom: 10,
      marginTop: 23,
    },
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
