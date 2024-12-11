import { useCurrentAccount } from "@data/store/accountsStore";
import { useGroupDescription } from "@hooks/useGroupDescription";
import { useGroupMembers } from "@hooks/useGroupMembers";
import { useGroupPermissions } from "@hooks/useGroupPermissions";
import { translate } from "@i18n";
import { textPrimaryColor, textSecondaryColor } from "@styles/colors";
import {
  getAddressIsAdmin,
  getAddressIsSuperAdmin,
} from "@utils/groupUtils/adminUtils";
import { memberCanUpdateGroup } from "@utils/groupUtils/memberCanUpdateGroup";
import logger from "@utils/logger";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { FC, useCallback, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
} from "react-native";

type GroupScreenDescriptionProps = {
  topic: ConversationTopic;
};

export const GroupScreenDescription: FC<GroupScreenDescriptionProps> = ({
  topic,
}) => {
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
  const { permissions } = useGroupPermissions(topic);
  const { groupDescription, setGroupDescription } = useGroupDescription(topic);
  const [editing, setEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(
    groupDescription ?? ""
  );
  const canEditGroupDescription = memberCanUpdateGroup(
    permissions?.updateGroupDescriptionPolicy,
    currentAccountIsAdmin,
    currentAccountIsSuperAdmin
  );

  const handleDescriptionChange = useCallback(async () => {
    try {
      await setGroupDescription(editedDescription);
    } catch (e) {
      logger.error(e);
      Alert.alert("An error occurred");
    }
  }, [editedDescription, setGroupDescription]);

  const toggleEditing = useCallback(() => {
    setEditing((prev) => !prev);
  }, []);

  return editing ? (
    <TextInput
      style={styles.description}
      defaultValue={groupDescription}
      onChangeText={setEditedDescription}
      blurOnSubmit
      onSubmitEditing={handleDescriptionChange}
      returnKeyType="done"
      placeholder={translate("add_description")}
      autoFocus
    />
  ) : (
    <Pressable onPress={canEditGroupDescription ? toggleEditing : undefined}>
      <Text
        style={[
          styles.description,
          !groupDescription && styles.descriptionPlaceholder,
        ]}
        ellipsizeMode="tail"
        textBreakStrategy="highQuality"
        numberOfLines={1}
      >
        {groupDescription ? groupDescription : translate("add_description")}
      </Text>
    </Pressable>
  );
};

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    description: {
      color: textPrimaryColor(colorScheme),
      fontSize: 13,
      textAlign: "center",
      marginTop: 13,
    },
    descriptionPlaceholder: {
      color: textSecondaryColor(colorScheme),
    },
  });
};
