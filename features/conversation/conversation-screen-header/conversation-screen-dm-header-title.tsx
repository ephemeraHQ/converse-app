import { ConversationHeaderTitle } from "@/features/conversation/conversation-screen-header/conversation-screen-header-title";
import { usePreferredInboxAvatar } from "@/hooks/usePreferredInboxAvatar";
import { usePreferredInboxName } from "@/hooks/usePreferredInboxName";
import { useDmPeerInboxIdQuery } from "@/queries/use-dm-peer-inbox-id-query";
import { copyToClipboard } from "@/utils/clipboard";
import { Avatar } from "@components/Avatar";
import { useCurrentAccount } from "@data/store/accountsStore";
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

  const { data: peerInboxId } = useDmPeerInboxIdQuery({
    account,
    topic,
    caller: "DmConversationTitle",
  });

  const onPress = useCallback(() => {
    if (peerInboxId) {
      navigation.push("Profile", { inboxId: peerInboxId });
    }
  }, [navigation, peerInboxId]);

  const onLongPress = useCallback(() => {
    copyToClipboard(JSON.stringify(topic));
  }, [topic]);

  const { data: preferredInboxName, isLoading: isLoadingPreferredInboxName } =
    usePreferredInboxName({
      inboxId: peerInboxId!,
    });

  const { data: preferredAvatarUri, isLoading: isLoadingPreferredAvatarUri } =
    usePreferredInboxAvatar({
      inboxId: peerInboxId!,
    });

  if (isLoadingPreferredInboxName || isLoadingPreferredAvatarUri) {
    return null;
  }

  return (
    <ConversationHeaderTitle
      title={preferredInboxName}
      onLongPress={onLongPress}
      onPress={onPress}
      avatarComponent={
        <Avatar
          uri={preferredAvatarUri ?? undefined}
          size={theme.avatarSize.md}
          name={preferredInboxName}
        />
      }
    />
  );
};
