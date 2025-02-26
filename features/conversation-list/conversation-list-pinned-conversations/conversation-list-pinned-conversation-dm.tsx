import { useCallback } from "react";
import { Avatar } from "@/components/avatar";
import { VStack } from "@/design-system/VStack";
import { useCurrentSenderEthAddress } from "@/features/authentication/multi-inbox.store";
import { useConversationListPinnedConversationsStyles } from "@/features/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversations.styles";
import { useConversationIsUnread } from "@/features/conversation-list/hooks/use-conversation-is-unread";
import { useDmConversationContextMenuViewProps } from "@/features/conversation-list/hooks/use-conversation-list-item-context-menu-props";
import { usePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info";
import { IXmtpDmWithCodecs } from "@/features/xmtp/xmtp.types";
import { navigate } from "@/navigation/navigation.utils";
import { useDmPeerInboxIdQuery } from "@/queries/use-dm-peer-inbox-id-query";
import { isTextMessage } from "../../conversation/conversation-message/conversation-message.utils";
import { ConversationListPinnedConversation } from "./conversation-list-pinned-conversation";
import { PinnedConversationMessagePreview } from "./conversation-list-pinned-conversation-message-preview";

type IConversationListPinnedConversationDmProps = {
  conversation: IXmtpDmWithCodecs;
};

export const ConversationListPinnedConversationDm = ({
  conversation,
}: IConversationListPinnedConversationDmProps) => {
  const currentAccount = useCurrentSenderEthAddress()!;
  const conversationTopic = conversation.topic;
  const { avatarSize } = useConversationListPinnedConversationsStyles();

  const { data: peerInboxId } = useDmPeerInboxIdQuery({
    account: currentAccount!,
    topic: conversationTopic,
    caller: "ConversationListPinnedConversationDm",
  });

  const { displayName, avatarUrl } = usePreferredDisplayInfo({
    inboxId: peerInboxId,
  });

  const { isUnread } = useConversationIsUnread({
    topic: conversationTopic,
  });

  const onPress = useCallback(() => {
    navigate("Conversation", { topic: conversation.topic });
  }, [conversation.topic]);

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
          <Avatar size={avatarSize} uri={avatarUrl} name={displayName ?? ""} />
        }
        onPress={onPress}
        showUnread={isUnread}
        title={displayName ?? ""}
        contextMenuProps={contextMenuProps}
      />
      {displayMessagePreview && (
        <PinnedConversationMessagePreview message={conversation.lastMessage!} />
      )}
    </VStack>
  );
};
