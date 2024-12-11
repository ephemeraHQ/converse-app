import { ConversationTitle } from "@/features/conversation/conversation-title";
import { copyToClipboard } from "@/utils/clipboard";
import Avatar from "@components/Avatar";
import { useCurrentAccount } from "@data/store/accountsStore";
import { usePreferredAvatarUri } from "@hooks/usePreferredAvatarUri";
import { usePreferredName } from "@hooks/usePreferredName";
import { useProfileSocials } from "@hooks/useProfileSocials";
import { useRouter } from "@navigation/useNavigation";
import { useDmPeerAddressQuery } from "@queries/useDmPeerAddressQuery";
import { AvatarSizes } from "@styles/sizes";
import { ThemedStyle, useAppTheme } from "@theme/useAppTheme";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { useCallback } from "react";
import { ImageStyle, Platform } from "react-native";

type DmConversationTitleProps = {
  topic: ConversationTopic;
};

export const DmConversationTitle = ({ topic }: DmConversationTitleProps) => {
  const account = useCurrentAccount()!;

  const navigation = useRouter();

  const { themed } = useAppTheme();

  const { data: peerAddress } = useDmPeerAddressQuery(account, topic);

  const onPress = useCallback(() => {
    if (peerAddress) {
      navigation.push("Profile", { address: peerAddress });
    }
  }, [navigation, peerAddress]);

  const onLongPress = useCallback(() => {
    copyToClipboard(JSON.stringify(topic));
  }, [topic]);

  const { isLoading } = useProfileSocials(peerAddress ?? "");

  const preferredName = usePreferredName(peerAddress ?? "");

  const preferredAvatarUri = usePreferredAvatarUri(peerAddress ?? "");

  const displayAvatar = peerAddress && !isLoading;
  if (!displayAvatar) return null;

  return (
    <ConversationTitle
      title={preferredName}
      onLongPress={onLongPress}
      onPress={onPress}
      avatarComponent={
        displayAvatar && (
          <Avatar
            uri={preferredAvatarUri ?? undefined}
            size={AvatarSizes.conversationTitle}
            style={themed($avatar)}
            name={preferredName}
          />
        )
      }
    />
  );
};

const $avatar: ThemedStyle<ImageStyle> = (theme) => ({
  marginRight: Platform.OS === "android" ? theme.spacing.lg : theme.spacing.xxs,
  marginLeft: Platform.OS === "ios" ? theme.spacing.zero : -theme.spacing.xxs,
});
