import Avatar from "@components/Avatar";
import { useCallback, useMemo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { usePreferredInboxAddress } from "@hooks/usePreferredInboxAddress";
import { usePreferredInboxName } from "@hooks/usePreferredInboxName";
import { useInboxProfileSocialsQuery } from "@queries/useInboxProfileSocialsQuery";
import { useAppTheme } from "@theme/useAppTheme";
import { InboxId } from "@xmtp/react-native-sdk";
import {
  useCurrentAccount,
  useProfilesStore,
} from "../../../data/store/accountsStore";
import { navigate } from "../../../utils/navigation";
import {
  getPreferredAvatar,
  getPreferredInboxAvatar,
  getPreferredName,
  getProfile,
} from "../../../utils/profile";

type MessageSenderAvatarDumbProps = {
  // hasNextMessageInSeries: boolean;
  onPress: () => void;
  avatarUri: string | undefined;
  avatarName: string;
};

export const MessageSenderAvatarDumb = ({
  // hasNextMessageInSeries,
  onPress,
  avatarUri,
  avatarName,
}: MessageSenderAvatarDumbProps) => {
  const styles = useStyles();
  const { theme } = useAppTheme();

  return (
    <View style={styles.groupSenderAvatarWrapper}>
      {/* {!hasNextMessageInSeries ? ( */}
      <TouchableOpacity onPress={onPress}>
        <Avatar
          size={theme.layout.chat.messageSenderAvatar.width}
          uri={avatarUri}
          name={avatarName}
        />
      </TouchableOpacity>
      {/* ) : (
        <View style={styles.avatarPlaceholder} />
      )} */}
    </View>
  );
};

type MessageSenderAvatarProps = {
  senderAddress: string;
  hasNextMessageInSeries: boolean;
};

export const MessageSenderAvatar = ({
  senderAddress,
  hasNextMessageInSeries,
}: MessageSenderAvatarProps) => {
  const senderSocials = useProfilesStore(
    (s) => getProfile(senderAddress, s.profiles)?.socials
  );

  const openProfile = useCallback(() => {
    navigate("Profile", { address: senderAddress });
  }, [senderAddress]);

  return (
    <MessageSenderAvatarDumb
      hasNextMessageInSeries={hasNextMessageInSeries}
      onPress={openProfile}
      avatarUri={getPreferredAvatar(senderSocials)}
      avatarName={getPreferredName(senderSocials, senderAddress)}
    />
  );
};

type V3MessageSenderAvatarProps = {
  inboxId: InboxId;
};

export const V3MessageSenderAvatar = ({
  inboxId,
}: V3MessageSenderAvatarProps) => {
  const currentAccount = useCurrentAccount();
  const { data: senderSocials } = useInboxProfileSocialsQuery(
    currentAccount!,
    inboxId
  );
  const address = usePreferredInboxAddress(inboxId);
  const name = usePreferredInboxName(inboxId);
  const avatarUri = getPreferredInboxAvatar(senderSocials);
  const openProfile = useCallback(() => {
    if (address) {
      navigate("Profile", { address });
    }
  }, [address]);

  return (
    <MessageSenderAvatarDumb
      onPress={openProfile}
      avatarUri={avatarUri}
      avatarName={name}
    />
  );
};

const useStyles = () => {
  const { theme } = useAppTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        groupSenderAvatarWrapper: {
          // marginRight: 6,
        },
        avatarPlaceholder: {
          width: theme.avatarSize.sm,
          height: theme.avatarSize.sm,
        },
      }),
    []
  );
};
