import { getCurrentInboxId } from "@/data/store/accountsStore";
import { useGroupPermissionspForCurrentUser } from "@/hooks/useGroupPermissions";
import { useGroupPhotoForCurrentInbox } from "@/hooks/useGroupPhoto";
import Button from "@components/Button/Button";
import GroupAvatar from "@components/GroupAvatar";
import { useGroupMembers } from "@hooks/useGroupMembers";
import { usePhotoSelect } from "@hooks/usePhotoSelect";
import { translate } from "@i18n";
import { uploadFile } from "@utils/attachment/uploadFile";
import {
  isUserAdminByInboxId,
  isUserSuperAdminByInboxId,
} from "@utils/groupUtils/adminUtils";
import { memberCanUpdateGroup } from "@utils/groupUtils/memberCanUpdateGroup";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { FC, useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { List } from "react-native-paper";

type GroupScreenImageProps = {
  topic: ConversationTopic;
};

export const GroupScreenImage: FC<GroupScreenImageProps> = ({ topic }) => {
  const { groupPhoto, setGroupPhoto } = useGroupPhotoForCurrentInbox({
    topic,
  });
  const { permissions } = useGroupPermissionspForCurrentUser({ topic });
  const { members } = useGroupMembers({ topic });

  const { currentAccountIsAdmin, currentAccountIsSuperAdmin } = useMemo(
    () => ({
      currentAccountIsAdmin: isUserAdminByInboxId(
        getCurrentInboxId()!,
        members
      ),
      currentAccountIsSuperAdmin: isUserSuperAdminByInboxId(
        getCurrentInboxId()!,
        members
      ),
    }),
    [members]
  );

  const canEditGroupImage = memberCanUpdateGroup(
    permissions?.updateGroupImagePolicy,
    currentAccountIsAdmin,
    currentAccountIsSuperAdmin
  );

  const onPhotoChange = useCallback(
    (newImageUrl: string) => {
      uploadFile({
        inboxId: getCurrentInboxId()!,
        filePath: newImageUrl,
        contentType: "image/jpeg",
      }).then((url) => {
        setGroupPhoto(url);
      });
    },
    [setGroupPhoto]
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
          excludeSelf={false}
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
