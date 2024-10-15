import { currentAccount, useProfilesStore } from "@data/store/accountsStore";
import { HStack } from "@design-system/Hstack";
import { Text } from "@design-system/Text";
import { AvatarSizes } from "@styles/sizes";
import { spacing } from "@theme/spacing";
import {
  getPreferredAvatar,
  getPreferredName,
  getProfile,
} from "@utils/profile";
import { ViewStyle, StyleSheet } from "react-native";

import Avatar from "./Avatar";

type ICurrentAccountProps = {
  style?: ViewStyle;
};

const styles = StyleSheet.create({
  container: { alignItems: "center" },
  avatar: { marginRight: spacing.xs },
});

export function CurrentAccount(props: ICurrentAccountProps) {
  const account = currentAccount();
  const profiles = useProfilesStore((state) => state.profiles);
  const socials = getProfile(account, profiles)?.socials;
  const name = getPreferredName(socials, account);
  return (
    <HStack style={[styles.container, props.style]}>
      <Avatar
        uri={getPreferredAvatar(socials)}
        size={AvatarSizes.profileSettings}
        name={name}
        style={styles.avatar}
      />
      <Text>{name}</Text>
    </HStack>
  );
}
