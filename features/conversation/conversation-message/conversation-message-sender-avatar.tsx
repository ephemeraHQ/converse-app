import { useConversationMessageStyles } from "@/features/conversation/conversation-message/conversation-message.styles";
import { navigate } from "@/utils/navigation";
import { Avatar } from "@components/Avatar";
import { useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { useProfileQuery } from "@/features/profiles/profiles.query";

type IConversationSenderAvatarProps = {
  inboxId: string;
};

export function ConversationSenderAvatar({
  inboxId,
}: IConversationSenderAvatarProps) {
  const { senderAvatarSize } = useConversationMessageStyles();
  const { data: profile } = useProfileQuery({ xmtpId: inboxId });

  const openProfile = useCallback(() => {
    if (profile) {
      navigate("Profile", { inboxId });
    }
  }, [profile, inboxId]);

  return (
    <TouchableOpacity onPress={openProfile}>
      <Avatar
        size={senderAvatarSize}
        uri={profile?.avatar}
        name={profile?.name ?? ""}
      />
    </TouchableOpacity>
  );
}
