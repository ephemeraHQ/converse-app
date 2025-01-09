import { ConversationHeaderTitle } from "@/features/conversation/conversation-header/conversation-header-title";
import { usePreferredInboxAddress } from "@/hooks/usePreferredInboxAddress";
import { useDmPeerInboxIdForCurrentUser } from "@/queries/useDmPeerInbox";
import { copyToClipboard } from "@/utils/clipboard";
import Avatar from "@components/Avatar";
import { usePreferredAvatarUri } from "@hooks/usePreferredAvatarUri";
import { usePreferredName } from "@hooks/usePreferredName";
import { useProfileSocials } from "@hooks/useProfileSocials";
import { useRouter } from "@navigation/useNavigation";
import { useAppTheme } from "@theme/useAppTheme";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { useCallback } from "react";

type DmConversationTitleProps = {
  topic: ConversationTopic;
};

export const DmConversationTitle = ({ topic }: DmConversationTitleProps) => {
  const navigation = useRouter();

  const { theme } = useAppTheme();

  const { data: peerInboxId } = useDmPeerInboxIdForCurrentUser({
    topic,
  });

  const peerEthereumAddress = usePreferredInboxAddress(peerInboxId!);

  const onPress = useCallback(() => {
    if (peerEthereumAddress) {
      navigation.push("Profile", { inboxId: peerInboxId! });
    }
  }, [navigation, peerEthereumAddress]);

  const onLongPress = useCallback(() => {
    copyToClipboard(JSON.stringify(topic));
  }, [topic]);

  const { isLoading } = useProfileSocials({ inboxId: peerInboxId! });

  const preferredName = usePreferredName({ inboxId: peerInboxId! });

  const preferredAvatarUri = usePreferredAvatarUri({ inboxId: peerInboxId! });

  const displayAvatar = peerEthereumAddress && !isLoading;
  if (!displayAvatar) return null;

  return (
    <ConversationHeaderTitle
      title={preferredName}
      onLongPress={onLongPress}
      onPress={onPress}
      avatarComponent={
        displayAvatar && (
          <Avatar
            uri={preferredAvatarUri ?? undefined}
            size={theme.avatarSize.md}
            name={preferredName}
          />
        )
      }
    />
  );
};
