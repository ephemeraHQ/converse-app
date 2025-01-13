import { VStack } from "@/design-system/VStack";
import { PinnedConversationAvatar } from "@/features/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversation-avatar";
import { useConversationIsUnread } from "@/features/conversation-list/hooks/use-conversation-is-unread";
import { useConversationContextMenuViewDefaultProps } from "@/features/conversation-list/hooks/use-conversation-list-item-context-menu-default-props";
import { isTextMessage } from "@/features/conversation/conversation-message/conversation-message.utils";
import { GroupWithCodecsType } from "@/utils/xmtpRN/client.types";
import { navigate } from "@utils/navigation";
import { useCallback } from "react";
import { PinnedConversation } from "./conversation-list-pinned-conversation";
import { PinnedConversationMessagePreview } from "./conversation-list-pinned-conversation-message-preview";

type PinnedV3GroupConversationProps = {
  group: GroupWithCodecsType;
};

export const PinnedV3GroupConversation = ({
  group,
}: PinnedV3GroupConversationProps) => {
  const groupConversationTopic = group.topic;

  const { isUnread } = useConversationIsUnread({
    topic: groupConversationTopic,
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
        <PinnedConversationMessagePreview message={group.lastMessage!} />
      )}
    </VStack>
  );
};
