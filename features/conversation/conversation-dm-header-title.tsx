import { ConversationTitle } from "@/features/conversation/conversation-title";
import { usePreferredInboxAddress } from "@/hooks/usePreferredInboxAddress";
import { useDmPeerInboxId } from "@/queries/useDmPeerInbox";
import { copyToClipboard } from "@/utils/clipboard";
import Avatar from "@components/Avatar";
import { useCurrentAccount } from "@data/store/accountsStore";
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
  const account = useCurrentAccount()!;

  const navigation = useRouter();

  const { theme } = useAppTheme();

  const { data: peerInboxId } = useDmPeerInboxId({ account, topic });

  const peerAddress = usePreferredInboxAddress(peerInboxId!);

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
            size={theme.avatarSize.md}
            name={preferredName}
          />
        )
      }
    />
  );
};
