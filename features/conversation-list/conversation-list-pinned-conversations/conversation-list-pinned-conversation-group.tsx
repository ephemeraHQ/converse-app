import { VStack } from "@/design-system/VStack";
import { PinnedConversationAvatar } from "@/features/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversation-avatar";
import { useConversationIsUnread } from "@/features/conversation-list/hooks/use-conversation-is-unread";
import { useGroupConversationContextMenuViewProps } from "@/features/conversation-list/hooks/use-conversation-list-item-context-menu-props";
import { isTextMessage } from "@/features/conversation/conversation-message/conversation-message.utils";
import { useGroupName } from "@/hooks/useGroupName";
import { GroupWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { navigate } from "@/navigation/navigation.utils";
import { useCallback } from "react";
import { ConversationListPinnedConversation } from "./conversation-list-pinned-conversation";
import { PinnedConversationMessagePreview } from "./conversation-list-pinned-conversation-message-preview";

type IConversationListPinnedConversationGroupProps = {
  group: GroupWithCodecsType;
};

export const ConversationListPinnedConversationGroup = ({
  group,
}: IConversationListPinnedConversationGroupProps) => {
  const groupConversationTopic = group.topic;

  const { isUnread } = useConversationIsUnread({
    topic: groupConversationTopic,
  });

  const onPress = useCallback(() => {
    navigate("Conversation", { topic: group.topic });
  }, [group.topic]);

  const { groupName } = useGroupName({
    conversationTopic: groupConversationTopic,
  });

  const displayMessagePreview =
    group.lastMessage && isTextMessage(group.lastMessage) && isUnread;

  const contextMenuProps = useGroupConversationContextMenuViewProps({
    groupConversationTopic: groupConversationTopic,
  });

  return (
    <VStack>
      <ConversationListPinnedConversation
        contextMenuProps={contextMenuProps}
        avatarComponent={
          <PinnedConversationAvatar
            uri={group?.imageUrlSquare}
            name={groupName}
          />
        }
        onPress={onPress}
        showUnread={isUnread}
        title={groupName ?? ""}
      />
      {displayMessagePreview && (
        <PinnedConversationMessagePreview message={group.lastMessage!} />
      )}
    </VStack>
  );
};
