import { ConversationTitle } from "@/features/conversation/conversation-title";
import Avatar from "@components/Avatar";
import { usePreferredAvatarUri } from "@hooks/usePreferredAvatarUri";
import { usePreferredName } from "@hooks/usePreferredName";
import { useProfileSocials } from "@hooks/useProfileSocials";
import { useRouter } from "@navigation/useNavigation";
import { useAppTheme } from "@theme/useAppTheme";
import { useCallback } from "react";

type NewConversationTitleProps = {
  peerAddress: string;
};

export const NewConversationTitle = ({
  peerAddress,
}: NewConversationTitleProps) => {
  const navigation = useRouter();

  const { theme } = useAppTheme();

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
            size={theme.avatarSize.md}
          />
        )
      }
    />
  );
};
