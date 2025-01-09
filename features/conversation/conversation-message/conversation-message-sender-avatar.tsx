import { useCurrentInboxId } from "@/data/store/accountsStore";
import { useInboxProfileSocials } from "@/hooks/useInboxProfileSocials";
import { useInboxProfilesSocials } from "@/hooks/useInboxProfilesSocials";
import { useAppTheme } from "@/theme/useAppTheme";
import { navigate } from "@/utils/navigation";
import { getPreferredInboxAvatar } from "@/utils/profile";
import Avatar from "@components/Avatar";
import { usePreferredInboxAddress } from "@hooks/usePreferredInboxAddress";
import { usePreferredInboxName } from "@hooks/usePreferredInboxName";
import { InboxId } from "@xmtp/react-native-sdk";
import { useCallback } from "react";
import { TouchableOpacity } from "react-native";

type IConversationSenderAvatarProps = {
  inboxId: InboxId;
};

export function ConversationSenderAvatar({
  inboxId,
}: IConversationSenderAvatarProps) {
  const { theme } = useAppTheme();
  // todo(lustig) more of this socials typing issues
  // @ts-expect-error
  const { data: senderSocials } = useInboxProfilesSocials([inboxId]);
  const address = usePreferredInboxAddress(inboxId);
  const name = usePreferredInboxName(inboxId);
  const avatarUri = getPreferredInboxAvatar(senderSocials);

  const openProfile = useCallback(() => {
    if (address) {
      navigate("Profile", { inboxId });
    }
  }, [address]);

  return (
    <TouchableOpacity onPress={openProfile}>
      <Avatar
        size={theme.layout.chat.messageSenderAvatar.width}
        uri={avatarUri}
        name={name}
      />
    </TouchableOpacity>
  );
}
