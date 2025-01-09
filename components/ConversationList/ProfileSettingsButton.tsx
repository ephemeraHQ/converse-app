import { AvatarSizes } from "@styles/sizes";
import React, { useCallback } from "react";
import { Platform, TouchableOpacity } from "react-native";

import { navigate } from "@utils/navigation";
import Avatar from "../Avatar";
import { usePreferredName } from "@/hooks/usePreferredName";
import { usePreferredAvatarUri } from "@/hooks/usePreferredAvatarUri";
import { useCurrentInboxId } from "@data/store/accountsStore";

export default function ProfileSettingsButton() {
  const inboxId = useCurrentInboxId();

  const displayName = usePreferredName({ inboxId: inboxId! });
  const avatarUri = usePreferredAvatarUri({ inboxId: inboxId! });

  const openProfile = useCallback(() => {
    navigate("Profile", { inboxId: inboxId! });
  }, [inboxId]);

  return (
    <TouchableOpacity activeOpacity={0.2} onPress={openProfile}>
      <Avatar
        uri={avatarUri}
        size={AvatarSizes.profileSettings}
        style={{
          marginRight: Platform.OS === "android" ? 0 : 10,
          marginTop: Platform.OS === "ios" ? 3 : 0,
        }}
        name={displayName}
      />
    </TouchableOpacity>
  );
}
