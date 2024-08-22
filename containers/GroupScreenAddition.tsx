import Picto from "@components/Picto/Picto";
import { useChatStore, useCurrentAccount } from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";
import { useExistingGroupInviteLink } from "@hooks/useExistingGroupInviteLink";
import { useGroupDescription } from "@hooks/useGroupDescription";
import { useGroupMembers } from "@hooks/useGroupMembers";
import { useGroupName } from "@hooks/useGroupName";
import { useGroupPermissions } from "@hooks/useGroupPermissions";
import { useGroupPhoto } from "@hooks/useGroupPhoto";
import { translate } from "@i18n";
import Clipboard from "@react-native-clipboard/clipboard";
import {
  actionSecondaryColor,
  inversePrimaryColor,
  tertiaryBackgroundColor,
} from "@styles/colors";
import { PictoSizes } from "@styles/sizes";
import { createGroupInvite, deleteGroupInvite } from "@utils/api";
import {
  saveGroupInviteLink,
  deleteGroupInviteLink as deleteLinkFromStore,
  saveInviteIdByGroupId,
  deleteInviteIdByGroupId,
  getInviteIdByGroupId,
} from "@utils/groupInvites";
import {
  getAddressIsAdmin,
  getAddressIsSuperAdmin,
} from "@utils/groupUtils/adminUtils";
import { getGroupIdFromTopic } from "@utils/groupUtils/groupId";
import { memberCanUpdateGroup } from "@utils/groupUtils/memberCanUpdateGroup";
import { navigate } from "@utils/navigation";
import * as Haptics from "expo-haptics";
import { FC, useCallback, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Portal, Snackbar, Text } from "react-native-paper";

interface GroupScreenAdditionProps {
  topic: string;
}

const noop = () => {};

export const GroupScreenAddition: FC<GroupScreenAdditionProps> = ({
  topic,
}) => {
  const colorScheme = useColorScheme();
  const currentAccount = useCurrentAccount() as string;
  const { members } = useGroupMembers(topic);
  const { currentAccountIsAdmin, currentAccountIsSuperAdmin } = useMemo(
    () => ({
      currentAccountIsAdmin: getAddressIsAdmin(members, currentAccount),
      currentAccountIsSuperAdmin: getAddressIsSuperAdmin(
        members,
        currentAccount
      ),
    }),
    [currentAccount, members]
  );
  const styles = useStyles();
  const [snackMessage, setSnackMessage] = useState<string | null>(null);
  const { permissions } = useGroupPermissions(topic);
  const canAddMember = memberCanUpdateGroup(
    permissions?.addMemberPolicy,
    currentAccountIsAdmin,
    currentAccountIsSuperAdmin
  );
  const { groupName } = useGroupName(topic);
  const { groupPhoto } = useGroupPhoto(topic);
  const { groupDescription } = useGroupDescription(topic);

  const groupInviteLink = useExistingGroupInviteLink(topic);
  const { setGroupInviteLink, deleteGroupInviteLink: deleteLinkFromState } =
    useChatStore(useSelect(["setGroupInviteLink", "deleteGroupInviteLink"]));
  const onAddMemberPress = useCallback(() => {
    navigate("NewConversation", { addingToGroupTopic: topic });
  }, [topic]);

  const onCopyInviteLinkPress = useCallback(() => {
    if (!groupInviteLink) {
      return;
    }
    setSnackMessage(translate("group_invite_link_copied"));
    Clipboard.setString(groupInviteLink);
  }, [groupInviteLink]);

  const onCreateInviteLinkPress = useCallback(() => {
    createGroupInvite(currentAccount, {
      groupName: groupName ?? "New Group",
      imageUrl: groupPhoto,
      description: groupDescription,
    })
      .then((groupInvite) => {
        saveInviteIdByGroupId(getGroupIdFromTopic(topic), groupInvite.id);
        saveGroupInviteLink(groupInvite.id, getGroupIdFromTopic(topic));
        setGroupInviteLink(topic, groupInvite.inviteLink);
        Clipboard.setString(groupInvite.inviteLink);
        setSnackMessage(translate("group_invite_link_created_copied"));
      })
      .catch((err) => {
        console.error("Error creating group invite", err);
        Alert.alert("An error occurred");
      });
  }, [
    currentAccount,
    groupDescription,
    groupName,
    groupPhoto,
    setGroupInviteLink,
    topic,
  ]);

  const onDeleteInviteLink = useCallback(() => {
    Haptics.impactAsync();
    const groupId = getGroupIdFromTopic(topic);
    const inviteId = getInviteIdByGroupId(groupId);
    if (!inviteId) {
      return;
    }
    deleteGroupInvite(currentAccount, inviteId).then(() => {
      setSnackMessage(translate("group_invite_link_deleted"));
      deleteLinkFromState(topic);
      deleteLinkFromStore(inviteId);
      deleteInviteIdByGroupId(groupId);
    });
  }, [deleteLinkFromState, topic, currentAccount]);

  const dismissSnackBar = useCallback(() => {
    setSnackMessage(null);
  }, [setSnackMessage]);

  if (!canAddMember) {
    return null;
  }

  const pictoSize =
    Platform.OS === "ios" ? undefined : PictoSizes.accoutSettings;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onAddMemberPress}
        style={[styles.itemContainer, styles.addContainer]}
      >
        <Picto
          size={pictoSize}
          style={styles.icon}
          picto="person.crop.circle.badge.plus"
        />
        <Text numberOfLines={2} style={styles.text}>
          {translate("add_more_members")}
        </Text>
      </TouchableOpacity>
      {groupInviteLink ? (
        <TouchableOpacity
          onPress={onCopyInviteLinkPress}
          style={[styles.itemContainer, styles.inviteContainer]}
          onLongPress={onDeleteInviteLink}
        >
          <Picto size={pictoSize} style={styles.icon} picto="link" />
          <Text style={styles.text}>{translate("copy_invite_link")}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={onCreateInviteLinkPress}
          onLongPress={noop}
          style={[styles.itemContainer, styles.inviteContainer]}
        >
          <Picto size={pictoSize} style={styles.icon} picto="link" />
          <Text style={styles.text}>{translate("create_invite_link")}</Text>
        </TouchableOpacity>
      )}
      <Portal>
        <Snackbar visible={!!snackMessage} onDismiss={dismissSnackBar}>
          <View style={styles.snackContainer}>
            <Picto
              size={pictoSize}
              color={inversePrimaryColor(colorScheme)}
              style={styles.icon}
              picto="link"
            />
            <Text style={styles.snackText}>{snackMessage}</Text>
          </View>
        </Snackbar>
      </Portal>
    </View>
  );
};

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      marginTop: 20,
      width: "100%",
    },
    itemContainer: {
      backgroundColor: tertiaryBackgroundColor(colorScheme),
      paddingVertical: 10,
      alignItems: "center",
      justifyContent: "space-between",
      borderRadius: 5,
      borderColor: actionSecondaryColor(colorScheme),
      borderWidth: 0.5,
      flex: 1,
    },
    addContainer: {
      marginRight: 10,
    },
    inviteContainer: {
      marginLeft: 10,
    },
    icon: {
      height: PictoSizes.accoutSettings,
      width: PictoSizes.accoutSettings,
      paddingTop: Platform.OS === "ios" ? 5 : 0,
    },
    text: {
      textAlign: "center",
      paddingHorizontal: 40,
      fontSize: 12,
    },
    snackText: {
      color: inversePrimaryColor(colorScheme),
      marginLeft: 5,
    },
    snackContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
  });
};
