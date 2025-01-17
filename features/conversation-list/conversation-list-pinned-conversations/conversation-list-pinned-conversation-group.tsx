import { VStack } from "@/design-system/VStack";
import { PinnedConversationAvatar } from "@/features/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversation-avatar";
import { useConversationIsUnread } from "@/features/conversation-list/hooks/use-conversation-is-unread";
import { isTextMessage } from "@/features/conversation/conversation-message/conversation-message.utils";
import { GroupWithCodecsType } from "@/utils/xmtpRN/client/client.types";
import { navigate } from "@utils/navigation";
import { useCallback } from "react";
import { ConversationListPinnedConversation } from "./conversation-list-pinned-conversation";
import { PinnedConversationMessagePreview } from "./conversation-list-pinned-conversation-message-preview";
import { useGroupConversationContextMenuViewProps } from "@/features/conversation-list/hooks/use-conversation-list-item-context-menu-props";

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

  const title = group?.name;

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
