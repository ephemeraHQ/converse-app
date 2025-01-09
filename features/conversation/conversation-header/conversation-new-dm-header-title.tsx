import { ConversationHeaderTitle } from "@/features/conversation/conversation-header/conversation-header-title";
import Avatar from "@components/Avatar";
import { usePreferredAvatarUri } from "@hooks/usePreferredAvatarUri";
import { usePreferredName } from "@hooks/usePreferredName";
import { useProfileSocials } from "@hooks/useProfileSocials";
import { useRouter } from "@navigation/useNavigation";
import { useAppTheme } from "@theme/useAppTheme";
import { useCallback } from "react";

type NewConversationTitleProps = {
  peerInboxId: string;
};

export const NewConversationTitle = ({
  peerInboxId,
}: NewConversationTitleProps) => {
  const navigation = useRouter();

  const { theme } = useAppTheme();

  const onPress = useCallback(() => {
    if (peerInboxId) {
      navigation.push("Profile", { inboxId: peerInboxId });
    }
  }, [navigation, peerInboxId]);

  const { isLoading } = useProfileSocials({ peerInboxId });

  const preferredName = usePreferredName({ inboxId: peerInboxId });

  const preferredAvatarUri = usePreferredAvatarUri({ inboxId: peerInboxId });

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
