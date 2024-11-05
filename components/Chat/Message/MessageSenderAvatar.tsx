import Avatar from "@components/Avatar";
import { AvatarSizes } from "@styles/sizes";
import { useCallback, useMemo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import {
  useCurrentAccount,
  useProfilesStore,
} from "../../../data/store/accountsStore";
import { navigate } from "../../../utils/navigation";
import {
  getPreferredAvatar,
  getPreferredName,
  getProfile,
} from "../../../utils/profile";
import { useInboxProfileSocialsQuery } from "@queries/useInboxProfileSocialsQuery";
import { InboxId } from "@xmtp/react-native-sdk";

type MessageSenderAvatarDumbProps = {
  hasNextMessageInSeries: boolean;
  onPress: () => void;
  avatarUri: string | undefined;
  avatarName: string;
};

export const MessageSenderAvatarDumb = ({
  hasNextMessageInSeries,
  onPress,
  avatarUri,
  avatarName,
}: MessageSenderAvatarDumbProps) => {
  const styles = useStyles();

  return (
    <View style={styles.groupSenderAvatarWrapper}>
      {!hasNextMessageInSeries ? (
        <TouchableOpacity onPress={onPress}>
          <Avatar
            size={AvatarSizes.messageSender}
            uri={avatarUri}
            name={avatarName}
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.avatarPlaceholder} />
      )}
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
  const address = senderSocials?.[0].address ?? "";
  const name = getPreferredName(
    senderSocials?.[0],
    senderSocials?.[0]?.address ?? ""
  );
  const avatarUri = getPreferredAvatar(senderSocials?.[0]);
  const openProfile = useCallback(() => {
    navigate("Profile", { address });
  }, [address]);

  return (
    <MessageSenderAvatarDumb
      hasNextMessageInSeries={false}
      onPress={openProfile}
      avatarUri={avatarUri}
      avatarName={name}
    />
  );
};

const useStyles = () => {
  return useMemo(
    () =>
      StyleSheet.create({
        groupSenderAvatarWrapper: {
          marginRight: 6,
        },
        avatarPlaceholder: {
          width: AvatarSizes.messageSender,
          height: AvatarSizes.messageSender,
        },
      }),
    []
  );
};
