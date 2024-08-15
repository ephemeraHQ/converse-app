import { useGroupName } from "@hooks/useGroupName";
import { useGroupPermissions } from "@hooks/useGroupPermissions";
import { textPrimaryColor } from "@styles/colors";
import { memberCanUpdateGroup } from "@utils/groupUtils/memberCanUpdateGroup";
import logger from "@utils/logger";
import { formatGroupName } from "@utils/str";
import React, { FC, useCallback, useState } from "react";
import {
  StyleSheet,
  TextInput,
  useColorScheme,
  Text,
  Alert,
} from "react-native";

interface GroupScreenNameProps {
  topic: string;
  currentAccountIsAdmin: boolean;
  currentAccountIsSuperAdmin: boolean;
}

export const GroupScreenName: FC<GroupScreenNameProps> = ({
  topic,
  currentAccountIsAdmin,
  currentAccountIsSuperAdmin,
}) => {
  const styles = useStyles();
  const { permissions } = useGroupPermissions(topic);
  const { groupName, setGroupName } = useGroupName(topic);
  const formattedGroupName = formatGroupName(topic, groupName);

  const [editedName, setEditedName] = useState(formattedGroupName);

  const handleNameChange = useCallback(async () => {
    try {
      await setGroupName(editedName);
    } catch (e) {
      logger.error(e);
      Alert.alert("An error occurred");
    }
  }, [editedName, setGroupName]);
  const canEditGroupName = memberCanUpdateGroup(
    permissions?.updateGroupNamePolicy,
    currentAccountIsAdmin,
    currentAccountIsSuperAdmin
  );
  return canEditGroupName ? (
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
