import { useCurrentInboxId } from "@/data/store/accountsStore";
import { useGroupNameForCurrentUser } from "@/hooks/useGroupName";
import { useGroupPermissionspForCurrentUser } from "@/hooks/useGroupPermissions";
import { translate } from "@/i18n";
import { captureErrorWithToast } from "@/utils/capture-error";
import { useGroupMembers } from "@hooks/useGroupMembers";
import { textPrimaryColor } from "@styles/colors";
import {
  isUserAdminByInboxId,
  isUserSuperAdminByInboxId,
} from "@utils/groupUtils/adminUtils";
import { memberCanUpdateGroup } from "@utils/groupUtils/memberCanUpdateGroup";
import { formatGroupName } from "@utils/str";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import React, { FC, useCallback, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
} from "react-native";

type GroupScreenNameProps = {
  topic: ConversationTopic;
};

export const GroupScreenName: FC<GroupScreenNameProps> = ({ topic }) => {
  const styles = useStyles();
  const { permissions } = useGroupPermissionspForCurrentUser({ topic });
  const currentInboxId = useCurrentInboxId()!;
  const { groupName, updateGroupName } = useGroupNameForCurrentUser({ topic });
  const formattedGroupName = formatGroupName({ topic, groupName });
  const { members } = useGroupMembers({ topic });

  const { currentAccountIsAdmin, currentAccountIsSuperAdmin } = useMemo(
    () => ({
      currentAccountIsAdmin: isUserAdminByInboxId(currentInboxId, members),
      currentAccountIsSuperAdmin: isUserSuperAdminByInboxId(
        currentInboxId,
        members
      ),
    }),
    [currentInboxId, members]
  );
  const [editing, setEditing] = useState(false);
  const [editedName, setEditedName] = useState(formattedGroupName);

  const handleNameChange = useCallback(async () => {
    try {
      setEditing(false);
      await updateGroupName(editedName);
    } catch (e) {
      captureErrorWithToast(e, {
        message: translate("group_opertation_an_error_occurred"),
      });
    }
  }, [editedName, updateGroupName]);
  const canEditGroupName = memberCanUpdateGroup(
    permissions?.updateGroupNamePolicy,
    currentAccountIsAdmin,
    currentAccountIsSuperAdmin
  );

  const toggleEditing = useCallback(() => {
    setEditing((prev) => !prev);
  }, []);

  return editing ? (
    <TextInput
      style={styles.title}
      defaultValue={formattedGroupName}
      onChangeText={setEditedName}
      blurOnSubmit
      onSubmitEditing={handleNameChange}
      returnKeyType="done"
      autoFocus
      textBreakStrategy="simple"
    />
  ) : (
    <Pressable onPress={canEditGroupName ? toggleEditing : undefined}>
      <Text style={styles.title} ellipsizeMode="tail" numberOfLines={1}>
        {formattedGroupName}
      </Text>
    </Pressable>
  );
};

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
  });
};
