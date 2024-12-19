import { useCurrentAccount } from "@/data/store/accountsStore";
import { navigate } from "@/utils/navigation";
import { getPreferredInboxAvatar } from "@/utils/profile";
import Avatar from "@components/Avatar";
import { usePreferredInboxAddress } from "@hooks/usePreferredInboxAddress";
import { usePreferredInboxName } from "@hooks/usePreferredInboxName";
import { useInboxProfileSocialsQuery } from "@queries/useInboxProfileSocialsQuery";
import { useAppTheme } from "@theme/useAppTheme";
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
  const currentAccount = useCurrentAccount();
  const { data: senderSocials } = useInboxProfileSocialsQuery(
    currentAccount!,
    inboxId
  );
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
      <Avatar
        size={theme.layout.chat.messageSenderAvatar.width}
        uri={avatarUri}
        name={name}
      />
    </TouchableOpacity>
  );
}
