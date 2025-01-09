import { VStack } from "@/design-system/VStack";
import { PinnedConversationAvatar } from "@/features/conversation-list/PinnedConversations/pinned-conversation-avatar";
import { useConversationContextMenuViewDefaultProps } from "@/features/conversation-list/hooks/use-conversation-list-item-context-menu-default-props";
import { useConversationIsUnread } from "@/features/conversation-list/hooks/useMessageIsUnread";
import { isTextMessage } from "@/features/conversation/conversation-message/conversation-message.utils";
import { GroupWithCodecsType } from "@/utils/xmtpRN/client.types";
import { navigate } from "@utils/navigation";
import { useCallback } from "react";
import { PinnedConversation } from "./PinnedConversation";
import { PinnedMessagePreview } from "./PinnedMessagePreview";

type PinnedV3GroupConversationProps = {
  group: GroupWithCodecsType;
};

export const PinnedV3GroupConversation = ({
  group,
}: PinnedV3GroupConversationProps) => {
  const groupConversationTopic = group.topic;

  const timestamp = group?.lastMessage?.sentNs ?? 0;

  const isUnread = useConversationIsUnread({
    topic: groupConversationTopic,
    lastMessage: group.lastMessage,
    timestampNs: timestamp,
  });

  const onPress = useCallback(() => {
    navigate("Conversation", { topic: group.topic });
  }, [group.topic]);

  const title = group?.name;

  const displayMessagePreview =
    group.lastMessage && isTextMessage(group.lastMessage) && isUnread;

  const contextMenuProps = useConversationContextMenuViewDefaultProps({
    conversationTopic: groupConversationTopic,
  });

  return (
    <VStack>
      <PinnedConversation
        contextMenuProps={contextMenuProps}
        avatarComponent={
          <PinnedConversationAvatar
            uri={group?.imageUrlSquare}
            name={group?.name}
          />
        }
        onPress={onPress}
        showUnread={isUnread}
        title={title ?? ""}
      />
      {displayMessagePreview && (
        <PinnedMessagePreview message={group.lastMessage!} />
      )}
    </VStack>
  );
};
