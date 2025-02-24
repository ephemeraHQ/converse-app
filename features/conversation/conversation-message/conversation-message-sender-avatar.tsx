import { useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { Avatar } from "@/components/avatar";
import { useConversationMessageStyles } from "@/features/conversation/conversation-message/conversation-message.styles";
import { useProfileQuery } from "@/features/profiles/profiles.query";
import { navigate } from "@/navigation/navigation.utils";

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
