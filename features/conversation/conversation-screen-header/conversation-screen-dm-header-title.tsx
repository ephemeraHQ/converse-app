import { ConversationTopic } from "@xmtp/react-native-sdk";
import { useCallback } from "react";
import { Avatar } from "@/components/avatar";
import { useCurrentSenderEthAddress } from "@/features/authentication/multi-inbox.store";
import { ConversationHeaderTitle } from "@/features/conversation/conversation-screen-header/conversation-screen-header-title";
import { useProfileQuery } from "@/features/profiles/profiles.query";
import { useRouter } from "@/navigation/use-navigation";
import { useDmPeerInboxIdQuery } from "@/queries/use-dm-peer-inbox-id-query";
import { useAppTheme } from "@/theme/use-app-theme";
import { copyToClipboard } from "@/utils/clipboard";

type DmConversationTitleProps = {
  topic: ConversationTopic;
};

export const DmConversationTitle = ({ topic }: DmConversationTitleProps) => {
  const account = useCurrentSenderEthAddress()!;

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

  const { data: profile, isLoading: isLoadingProfile } = useProfileQuery({
    xmtpId: peerInboxId!,
  });

  if (isLoadingProfile) {
    return null;
  }

  return (
    <ConversationHeaderTitle
      title={profile?.name}
      onLongPress={onLongPress}
      onPress={onPress}
      avatarComponent={
        <Avatar
          uri={profile?.avatar ?? undefined}
          size={theme.avatarSize.md}
          name={profile?.name}
        />
      }
    />
  );
};
