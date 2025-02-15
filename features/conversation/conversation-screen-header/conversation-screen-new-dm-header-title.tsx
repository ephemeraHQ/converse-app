import { ConversationHeaderTitle } from "@/features/conversation/conversation-screen-header/conversation-screen-header-title";
import { Avatar } from "@components/Avatar";
import { useInboxAvatar } from "@hooks/useInboxAvatar";
import { useInboxName } from "@hooks/useInboxName";
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

  const preferredName = useInboxName(peerAddress ?? "");

  const preferredAvatarUri = useInboxAvatar(peerAddress ?? "");

  const displayAvatar = !isLoading;

  if (!displayAvatar) return null;

  return (
    <ConversationHeaderTitle
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
