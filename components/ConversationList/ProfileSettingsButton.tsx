import { AvatarSizes } from "@styles/sizes";
import React, { useCallback } from "react";
import { Platform, TouchableOpacity } from "react-native";

import { currentAccount } from "@data/store/accountsStore";
import { navigate } from "@utils/navigation";
import Avatar from "../Avatar";
import { usePreferredName } from "@/hooks/usePreferredName";
import { usePreferredAvatarUri } from "@/hooks/usePreferredAvatarUri";

export default function ProfileSettingsButton() {
  const account = currentAccount();

  const displayName = usePreferredName(account);
  const avatarUri = usePreferredAvatarUri(account);

  const openProfile = useCallback(() => {
    navigate("Profile", { address: currentAccount() });
  }, []);

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
