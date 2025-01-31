import { GroupAvatarDumb } from "@/components/group-avatar";
import { useGroupMembersInfoForCurrentAccount } from "@/hooks/use-group-members-info-for-current-account";
import Button from "@components/Button/Button";
import { useCurrentAccount } from "@data/store/accountsStore";
import { useGroupMembers } from "@hooks/useGroupMembers";
import { useGroupPermissions } from "@hooks/useGroupPermissions";
import { useGroupPhoto } from "@hooks/useGroupPhoto";
import { usePhotoSelect } from "@hooks/usePhotoSelect";
import { translate } from "@i18n";
import { uploadFile } from "@utils/attachment/uploadFile";
import {
  getAddressIsAdmin,
  getAddressIsSuperAdmin,
} from "@utils/groupUtils/adminUtils";
import { memberCanUpdateGroup } from "@utils/groupUtils/memberCanUpdateGroup";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { FC, useCallback, useMemo } from "react";
import { View } from "react-native";
import { List } from "react-native-paper";

type GroupScreenImageProps = {
  topic: ConversationTopic;
};

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

  const { addPhoto: addGroupPhoto } = usePhotoSelect({
    initialPhoto: groupPhoto,
    onPhotoAdd: onPhotoChange,
  });

  const { groupMembersInfo } = useGroupMembersInfoForCurrentAccount({
    groupTopic: topic,
  });

  return (
    <List.Section>
      <View style={{ alignItems: "center" }}>
        <GroupAvatarDumb
          members={groupMembersInfo}
          style={{ marginBottom: 10, marginTop: 23 }}
        />
        {canEditGroupImage && (
          <Button
            variant="text"
            title={
              groupPhoto
                ? translate("change_profile_picture")
                : translate("add_profile_picture")
            }
            textStyle={{ fontWeight: "500" }}
            onPress={addGroupPhoto}
          />
        )}
      </View>
    </List.Section>
  );
};
