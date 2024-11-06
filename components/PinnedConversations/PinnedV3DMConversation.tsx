import { PinnedConversation } from "./PinnedConversation";
import { usePinnedConversationLongPress } from "../../features/conversation-list/usePinnedConversationLongPress";
import { useCallback, useMemo } from "react";
import { navigate } from "@utils/navigation";
import Avatar from "@components/Avatar";
import { AvatarSizes } from "@styles/sizes";
import { DmWithCodecsType } from "@utils/xmtpRN/client";
import { usePreferredName } from "@hooks/usePreferredName";
import { usePreferredAvatarUri } from "@hooks/usePreferredAvatarUri";

type PinnedV3DMConversationProps = {
  conversation: DmWithCodecsType;
};

export const PinnedV3DMConversation = ({
  conversation,
}: PinnedV3DMConversationProps) => {
  const peer = conversation.peerAddress;
  const preferredName = usePreferredName(peer);
  const preferredAvatar = usePreferredAvatarUri(peer);

  const onLongPress = usePinnedConversationLongPress(conversation.topic);
  const onPress = useCallback(() => {
    navigate("Conversation", { topic: conversation.topic });
  }, [conversation.topic]);

  const title = preferredName;
  const showUnread = false;

  const avatarComponent = useMemo(() => {
    return (
      <Avatar
        key={peer}
        uri={preferredAvatar ?? undefined}
        name={preferredName}
        size={AvatarSizes.pinnedConversation}
      />
    );
  }, [peer, preferredAvatar, preferredName]);

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
