import { PinnedConversation } from "./PinnedConversation";
import { usePinnedConversationLongPress } from "../../features/conversation-list/usePinnedConversationLongPress";
import { useCallback, useMemo } from "react";
import { navigate } from "@utils/navigation";
import Avatar from "@components/Avatar";
import { AvatarSizes } from "@styles/sizes";
import { DmWithCodecsType } from "@utils/xmtpRN/client";
import { usePreferredInboxName } from "@hooks/usePreferredInboxName";
import { usePreferredInboxAvatar } from "@hooks/usePreferredInboxAvatar";
import { useDmPeerInboxOnConversationList } from "@queries/useDmPeerInboxOnConversationList";
import { useCurrentAccount } from "@data/store/accountsStore";

type PinnedV3DMConversationProps = {
  conversation: DmWithCodecsType;
};

export const PinnedV3DMConversation = ({
  conversation,
}: PinnedV3DMConversationProps) => {
  const currentAccount = useCurrentAccount();
  const { data: peerInboxId } = useDmPeerInboxOnConversationList(
    currentAccount!,
    conversation
  );
  const preferredName = usePreferredInboxName(peerInboxId);
  const preferredAvatar = usePreferredInboxAvatar(peerInboxId);

  const onLongPress = usePinnedConversationLongPress(conversation.topic);

  const onPress = useCallback(() => {
    navigate("Conversation", { topic: conversation.topic });
  }, [conversation.topic]);

  const title = preferredName;
  const showUnread = false;

  const avatarComponent = useMemo(() => {
    return (
      <Avatar
        key={peerInboxId}
        uri={preferredAvatar ?? undefined}
        name={preferredName}
        size={AvatarSizes.pinnedConversation}
      />
    );
  }, [peerInboxId, preferredAvatar, preferredName]);

  return (
    <PinnedConversation
      avatarComponent={avatarComponent}
      onLongPress={onLongPress}
      onPress={onPress}
      showUnread={showUnread}
      title={title ?? ""}
    />
  );
};
