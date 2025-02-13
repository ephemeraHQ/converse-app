import { HStack } from "@design-system/HStack";
import { Text } from "@design-system/Text";
import { AvatarSizes } from "@styles/sizes";
import { spacing } from "@theme/spacing";
import { ViewStyle, StyleSheet } from "react-native";

import { Avatar } from "./Avatar";
import { usePreferredName } from "@/hooks/usePreferredName";
import { usePreferredAvatarUri } from "@/hooks/usePreferredAvatarUri";
import { useSafeCurrentSender } from "@/features/authentication/account.store";

type ICurrentAccountProps = {
  style?: ViewStyle;
};

const styles = StyleSheet.create({
  container: { alignItems: "center" },
  avatar: { marginRight: spacing.xs },
});

export function CurrentAccount(props: ICurrentAccountProps) {
  const account = useSafeCurrentSender().ethereumAddress;
  const name = usePreferredName(account);
  const avatarUri = usePreferredAvatarUri(account);

  return (
    <HStack style={[styles.container, props.style]}>
      <Avatar
        uri={avatarUri}
        size={AvatarSizes.profileSettings}
        name={name}
        style={styles.avatar}
      />
      <Text>{name}</Text>
    </HStack>
  );
}
