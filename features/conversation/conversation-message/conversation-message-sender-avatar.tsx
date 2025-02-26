import { useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { Avatar } from "@/components/avatar";
import { useConversationMessageStyles } from "@/features/conversation/conversation-message/conversation-message.styles";
import { usePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info";
import { navigate } from "@/navigation/navigation.utils";

type IConversationSenderAvatarProps = {
  inboxId: string;
};

export function ConversationSenderAvatar({
  inboxId,
}: IConversationSenderAvatarProps) {
  const { senderAvatarSize } = useConversationMessageStyles();
  const { displayName, avatarUrl } = usePreferredDisplayInfo({ inboxId });

  const openProfile = useCallback(() => {
    if (displayName) {
      navigate("Profile", { inboxId });
    }
  }, [displayName, inboxId]);

  return (
    <TouchableOpacity onPress={openProfile}>
      <Avatar
        size={senderAvatarSize}
        uri={avatarUrl}
        name={displayName ?? ""}
      />
    </TouchableOpacity>
  );
}
