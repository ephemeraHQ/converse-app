import { ConversationTitle } from "@/features/conversation/conversation-title";
import Avatar from "@components/Avatar";
import { usePreferredAvatarUri } from "@hooks/usePreferredAvatarUri";
import { usePreferredName } from "@hooks/usePreferredName";
import { useProfileSocials } from "@hooks/useProfileSocials";
import { useRouter } from "@navigation/useNavigation";
import { AvatarSizes } from "@styles/sizes";
import { ThemedStyle, useAppTheme } from "@theme/useAppTheme";
import { useCallback } from "react";
import { ImageStyle, Platform } from "react-native";

type NewConversationTitleProps = {
  peerAddress: string;
};

export const NewConversationTitle = ({
  peerAddress,
}: NewConversationTitleProps) => {
  const navigation = useRouter();

  const { themed } = useAppTheme();

  const onPress = useCallback(() => {
    if (peerAddress) {
      navigation.push("Profile", { address: peerAddress });
    }
  }, [navigation, peerAddress]);

  const { isLoading } = useProfileSocials(peerAddress ?? "");

  const preferredName = usePreferredName(peerAddress ?? "");

  const preferredAvatarUri = usePreferredAvatarUri(peerAddress ?? "");

  const displayAvatar = !isLoading;

  if (!displayAvatar) return null;

  return (
    <ConversationTitle
      title={preferredName}
      onPress={onPress}
      avatarComponent={
        displayAvatar && (
          <Avatar
            uri={preferredAvatarUri ?? undefined}
            size={AvatarSizes.conversationTitle}
            style={themed($avatar)}
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
