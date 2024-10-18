import GroupAvatar from "@components/GroupAvatar";
import { useCurrentAccount } from "@data/store/accountsStore";
import { Button } from "@design-system/Button/Button";
import { useGroupMembers } from "@hooks/useGroupMembers";
import { useGroupPermissions } from "@hooks/useGroupPermissions";
import { useGroupPhoto } from "@hooks/useGroupPhoto";
import { usePhotoSelect } from "@hooks/usePhotoSelect";
import { translate } from "@i18n";
import {
  getAddressIsAdmin,
  getAddressIsSuperAdmin,
} from "@utils/groupUtils/adminUtils";
import { memberCanUpdateGroup } from "@utils/groupUtils/memberCanUpdateGroup";
import { FC, useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { List } from "react-native-paper";

import { uploadFile } from "../utils/attachment";

interface GroupScreenImageProps {
  topic: string;
}

export const GroupScreenImage: FC<GroupScreenImageProps> = ({ topic }) => {
  const currentAccount = useCurrentAccount() as string;
  const { groupPhoto, setGroupPhoto } = useGroupPhoto(topic);
  const { permissions } = useGroupPermissions(topic);
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

  const canEditGroupImage = memberCanUpdateGroup(
    permissions?.updateGroupImagePolicy,
    currentAccountIsAdmin,
    currentAccountIsSuperAdmin
  );

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
  return (
    <List.Section>
      <View style={styles.container}>
        <GroupAvatar
          uri={localGroupPhoto}
          style={styles.avatar}
          topic={topic}
        />
        {canEditGroupImage && (
          <Button
            variant="text"
            title={
              groupPhoto
                ? translate("change_profile_picture")
                : translate("add_profile_picture")
            }
            textStyle={styles.buttonText}
            onPress={addGroupPhoto}
          />
        )}
      </View>
    </List.Section>
  );
};

const styles = StyleSheet.create({
  avatar: {
    marginBottom: 10,
    marginTop: 23,
  },
  container: {
    alignItems: "center",
  },
  buttonText: {
    fontWeight: "500",
  },
});
