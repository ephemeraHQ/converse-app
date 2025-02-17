import { useConversationMessageStyles } from "@/features/conversation/conversation-message/conversation-message.styles";
import { usePreferredInboxAvatar } from "@/hooks/usePreferredInboxAvatar";
import { navigate } from "@/utils/navigation";
import { Avatar } from "@components/Avatar";
import { usePreferredInboxAddress } from "@hooks/usePreferredInboxAddress";
import { useInboxName } from "@hooks/useInboxName";
import { InboxId } from "@xmtp/react-native-sdk";
import { useCallback } from "react";
import { TouchableOpacity } from "react-native";

type IConversationSenderAvatarProps = {
  inboxId: InboxId;
};

export function ConversationSenderAvatar({
  inboxId,
}: IConversationSenderAvatarProps) {
  const { senderAvatarSize } = useConversationMessageStyles();

  const { data: address } = usePreferredInboxAddress({ inboxId });
  const { data: name } = useInboxName({
    inboxId,
  });
  const { data: avatarUri } = usePreferredInboxAvatar({
    inboxId,
  });

  const openProfile = useCallback(() => {
    if (address) {
      navigate("Profile", { inboxId });
    }
  }, [address, inboxId]);

  return (
    <TouchableOpacity onPress={openProfile}>
      <Avatar size={senderAvatarSize} uri={avatarUri} name={name} />
    </TouchableOpacity>
  );
}
