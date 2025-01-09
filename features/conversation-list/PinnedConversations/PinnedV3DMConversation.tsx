import { VStack } from "@/design-system/VStack";
import { PinnedConversationAvatar } from "@/features/conversation-list/PinnedConversations/pinned-conversation-avatar";
import { useConversationContextMenuViewDefaultProps } from "@/features/conversation-list/hooks/use-conversation-list-item-context-menu-default-props";
import { useConversationIsUnread } from "@/features/conversation-list/hooks/useMessageIsUnread";
import { useDmPeerInboxId } from "@/queries/useDmPeerInbox";
import { useAppTheme } from "@/theme/useAppTheme";
import { DmWithCodecsType } from "@/utils/xmtpRN/client.types";
import { useCurrentAccount } from "@data/store/accountsStore";
import { usePreferredInboxAvatar } from "@hooks/usePreferredInboxAvatar";
import { usePreferredInboxName } from "@hooks/usePreferredInboxName";
import { navigate } from "@utils/navigation";
import { useCallback } from "react";
import { isTextMessage } from "../../conversation/conversation-message/conversation-message.utils";
import { PinnedConversation } from "./PinnedConversation";
import { PinnedMessagePreview } from "./PinnedMessagePreview";

type PinnedV3DMConversationProps = {
  conversation: DmWithCodecsType;
};

export const PinnedV3DMConversation = ({
  conversation,
}: PinnedV3DMConversationProps) => {
  const currentAccount = useCurrentAccount()!;

  const conversationTopic = conversation.topic;

  const { data: peerInboxId } = useDmPeerInboxId({
    account: currentAccount!,
    topic: conversationTopic,
  });

  const preferredName = usePreferredInboxName(peerInboxId);

  const preferredAvatar = usePreferredInboxAvatar(peerInboxId);

  const timestamp = conversation?.lastMessage?.sentNs ?? 0;

  const isUnread = useConversationIsUnread({
    topic: conversationTopic,
    lastMessage: conversation.lastMessage,
    timestampNs: timestamp,
  });

  const { theme } = useAppTheme();

  const onPress = useCallback(() => {
    navigate("Conversation", { topic: conversation.topic });
  }, [conversation.topic]);

  const title = preferredName;

  const displayMessagePreview =
    conversation.lastMessage &&
    isTextMessage(conversation.lastMessage) &&
    isUnread;

  const contextMenuProps = useConversationContextMenuViewDefaultProps({
    conversationTopic,
  });

  return (
    <VStack>
      <PinnedConversation
        avatarComponent={
          <PinnedConversationAvatar
            uri={preferredAvatar ?? undefined}
            name={preferredName}
          />
        }
        onPress={onPress}
        showUnread={isUnread}
        title={title ?? ""}
        contextMenuProps={contextMenuProps}
      />
      {displayMessagePreview && (
        <PinnedMessagePreview message={conversation.lastMessage!} />
      )}
    </VStack>
  );
};
