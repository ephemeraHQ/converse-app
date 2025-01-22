import { useConversationMessageStyles } from "@/features/conversation/conversation-message/conversation-message.styles";
import { navigate } from "@/utils/navigation";
import { getPreferredInboxAvatar } from "@/utils/profile";
import { Avatar } from "@components/Avatar";
import { usePreferredInboxAddress } from "@hooks/usePreferredInboxAddress";
import { usePreferredInboxName } from "@hooks/usePreferredInboxName";
import { useInboxProfileSocialsQuery } from "@queries/useInboxProfileSocialsQuery";
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
  const { data: senderSocials } = useInboxProfileSocialsQuery(inboxId);
  const address = usePreferredInboxAddress(inboxId);
  const name = usePreferredInboxName(inboxId);
  const avatarUri = getPreferredInboxAvatar(senderSocials);

  const openProfile = useCallback(() => {
    if (address) {
      navigate("Profile", { address });
    }
  }, [address]);

  return (
    <TouchableOpacity onPress={openProfile}>
      <Avatar size={senderAvatarSize} uri={avatarUri} name={name} />
    </TouchableOpacity>
  );
}
