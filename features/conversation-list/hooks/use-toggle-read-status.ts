import { getCurrentAccount } from "@/data/store/accountsStore";
import { useMarkConversationAsRead } from "@/features/conversation/hooks/use-mark-conversation-as-read";
import { useMarkConversationAsUnread } from "@/features/conversation/hooks/use-mark-conversation-as-unread";
import { conversationIsUnreadByTimestamp } from "@/features/conversation/utils/conversation-is-unread-by-current-account";
import { getConversationMetadataQueryData } from "@/queries/conversation-metadata-query";
import { getConversationQueryData } from "@/queries/useConversationQuery";
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
    const conversationData = getConversationMetadataQueryData({
      account: currentAccount,
      topic,
      context: "useToggleReadStatus",
    });

    const conversation = getConversationQueryData({
      account: currentAccount,
      topic,
      context: "useToggleReadStatus",
    });
    const convoIsUnreadByTimestamp = conversationIsUnreadByTimestamp({
      lastMessageSent: conversation?.lastMessage?.sentNs ?? 0,
      readUntil: conversationData?.readUntil ?? 0,
    });

    const isUnread =
      conversationData?.markedAsUnread ?? convoIsUnreadByTimestamp;

    if (isUnread) {
      await markAsReadAsync();
    } else {
      await markAsUnreadAsync();
    }
  }, [markAsReadAsync, markAsUnreadAsync, topic]);

  return { toggleReadStatusAsync };
};
