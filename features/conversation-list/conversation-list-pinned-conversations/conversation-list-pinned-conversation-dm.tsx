import { VStack } from "@/design-system/VStack";
import { PinnedConversationAvatar } from "@/features/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversation-avatar";
import { useConversationIsUnread } from "@/features/conversation-list/hooks/use-conversation-is-unread";
import { useDmConversationContextMenuViewProps } from "@/features/conversation-list/hooks/use-conversation-list-item-context-menu-props";
import { useDmPeerInboxIdQuery } from "@/queries/use-dm-peer-inbox-id-query";
import { DmWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { useCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import { navigate } from "@utils/navigation";
import { useCallback } from "react";
import { isTextMessage } from "../../conversation/conversation-message/conversation-message.utils";
import { ConversationListPinnedConversation } from "./conversation-list-pinned-conversation";
import { PinnedConversationMessagePreview } from "./conversation-list-pinned-conversation-message-preview";
import { useProfileQuery } from "@/features/profiles/profiles.query";

type IConversationListPinnedConversationDmProps = {
  conversation: DmWithCodecsType;
};

export const ConversationListPinnedConversationDm = ({
  conversation,
}: IConversationListPinnedConversationDmProps) => {
  const currentAccount = useCurrentAccount()!;

  const conversationTopic = conversation.topic;

  const { data: peerInboxId } = useDmPeerInboxIdQuery({
    account: currentAccount!,
    topic: conversationTopic,
    caller: "ConversationListPinnedConversationDm",
  });

  const { data: profile } = useProfileQuery(peerInboxId);

  const { isUnread } = useConversationIsUnread({
    topic: conversationTopic,
  });

  const onPress = useCallback(() => {
    navigate("Conversation", { topic: conversation.topic });
  }, [conversation.topic]);

  const title = profile?.name ?? "";
  const avatarUri = profile?.avatarUrl;

  const displayMessagePreview =
    conversation.lastMessage &&
    isTextMessage(conversation.lastMessage) &&
    isUnread;

  const contextMenuProps = useDmConversationContextMenuViewProps({
    dmConversationTopic: conversationTopic,
  });

  return (
    <VStack>
      <ConversationListPinnedConversation
        avatarComponent={
          <PinnedConversationAvatar uri={avatarUri} name={title} />
        }
        onPress={onPress}
        showUnread={isUnread}
        title={title}
        contextMenuProps={contextMenuProps}
      />
      {displayMessagePreview && (
        <PinnedConversationMessagePreview message={conversation.lastMessage!} />
      )}
    </VStack>
  );
};
