import { ConversationHeaderTitle } from "@/features/conversation/conversation-header/conversation-header-title";
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

  const peerEthereumAddress = usePreferredInboxAddress(peerInboxId!);

  const onPress = useCallback(() => {
    if (peerEthereumAddress) {
      navigation.push("Profile", { address: peerEthereumAddress });
    }
  }, [navigation, peerEthereumAddress]);

  const onLongPress = useCallback(() => {
    copyToClipboard(JSON.stringify(topic));
  }, [topic]);

  const { isLoading } = useProfileSocials(peerEthereumAddress ?? "");

  const preferredName = usePreferredName(peerEthereumAddress ?? "");

  const preferredAvatarUri = usePreferredAvatarUri(peerEthereumAddress ?? "");

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
