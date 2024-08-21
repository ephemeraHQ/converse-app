import { useCurrentAccount } from "@data/store/accountsStore";
import { useGroupDescription } from "@hooks/useGroupDescription";
import { useGroupMembers } from "@hooks/useGroupMembers";
import { useGroupPermissions } from "@hooks/useGroupPermissions";
import { translate } from "@i18n/translate";
import { textPrimaryColor } from "@styles/colors";
import {
  getAddressIsAdmin,
  getAddressIsSuperAdmin,
} from "@utils/groupUtils/adminUtils";
import { memberCanUpdateGroup } from "@utils/groupUtils/memberCanUpdateGroup";
import logger from "@utils/logger";
import { FC, useCallback, useMemo, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
} from "react-native";

interface GroupScreenDescriptionProps {
  topic: string;
}

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

  return canEditGroupDescription ? (
    <TextInput
      style={styles.description}
      defaultValue={groupDescription}
      value={editedDescription}
      onChangeText={setEditedDescription}
      blurOnSubmit
      onSubmitEditing={handleDescriptionChange}
      returnKeyType="done"
      placeholder={translate("add_description")}
    />
  ) : (
    <Text style={styles.description} ellipsizeMode="tail">
      {groupDescription}
    </Text>
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
  });
};
