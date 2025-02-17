import { HStack } from "@design-system/HStack";
import { Text } from "@design-system/Text";
import { AvatarSizes } from "@styles/sizes";
import { spacing } from "@theme/spacing";
import { ViewStyle, StyleSheet } from "react-native";

import { Avatar } from "./Avatar";
import { useSafeCurrentSender } from "@/features/multi-inbox/multi-inbox.store";
import { useInboxAvatar, useInboxName } from "@/features/inbox/inbox.api";

type ICurrentAccountProps = {
  style?: ViewStyle;
};

const styles = StyleSheet.create({
  container: { alignItems: "center" },
  avatar: { marginRight: spacing.xs },
});

export function CurrentAccount(props: ICurrentAccountProps) {
  const inboxId = useSafeCurrentSender().inboxId;
  const { data: name, isLoading } = useInboxName({ inboxId });
  const { data: avatarUri, isLoading: isAvatarLoading } = useInboxAvatar({
    inboxId,
  });

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
