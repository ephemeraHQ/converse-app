import { getCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import { useMarkConversationAsRead } from "@/features/conversation/hooks/use-mark-conversation-as-read";
import { useMarkConversationAsUnread } from "@/features/conversation/hooks/use-mark-conversation-as-unread";
import { conversationIsUnreadForInboxId } from "@/features/conversation/utils/conversation-is-unread-by-current-account";
import { getCurrentAccountInboxId } from "@/hooks/use-current-account-inbox-id";
import { getConversationMetadataQueryData } from "@/queries/conversation-metadata-query";
import { getConversationQueryData } from "@/queries/conversation-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { useCallback } from "react";

type UseToggleReadStatusProps = {
  topic: ConversationTopic;
};

export const useToggleReadStatus = ({ topic }: UseToggleReadStatusProps) => {
  const { markAsReadAsync } = useMarkConversationAsRead({
    topic,
  });
  const { markAsUnreadAsync } = useMarkConversationAsUnread({
    topic,
  });

  const toggleReadStatusAsync = useCallback(async () => {
    const currentAccount = getCurrentAccount()!;
    const currentAccountInboxId = getCurrentAccountInboxId();
    const conversationData = getConversationMetadataQueryData({
      account: currentAccount,
      topic,
    });
    const conversation = getConversationQueryData({
      account: currentAccount,
      topic,
    });

    const conversationIsUnread = conversationIsUnreadForInboxId({
      lastMessageSent: conversation?.lastMessage?.sentNs ?? null,
      lastMessageSenderInboxId:
        conversation?.lastMessage?.senderInboxId ?? null,
      consumerInboxId: currentAccountInboxId!,
      readUntil: conversationData?.readUntil ?? 0,
      markedAsUnread: conversationData?.markedAsUnread ?? false,
    });

    if (conversationIsUnread) {
      await markAsReadAsync();
    } else {
      await markAsUnreadAsync();
    }
  }, [markAsReadAsync, markAsUnreadAsync, topic]);

  return { toggleReadStatusAsync };
};
