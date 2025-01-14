import { getCurrentAccount } from "@/data/store/accountsStore";
import { conversationIsUnreadByTimestamp } from "@/features/conversation/utils/conversation-is-unread-by-current-account";
import {
  getConversationDataQueryData,
  setConversationDataQueryData,
} from "@/queries/use-conversation-data-query";
import { getConversationQueryData } from "@/queries/useConversationQuery";
import { markTopicAsRead, markTopicAsUnread } from "@/utils/api/topics";
import { useMutation } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { useCallback } from "react";

type UseToggleReadStatusProps = {
  topic: ConversationTopic;
};

export const useToggleReadStatus = ({ topic }: UseToggleReadStatusProps) => {
  const { mutateAsync: markAsReadAsync } = useMutation({
    mutationFn: async () => {
      const currentAccount = getCurrentAccount()!;
      await markTopicAsRead({
        account: currentAccount,
        topic,
        readUntil: new Date().getTime(),
      });
    },
    onMutate: () => {
      const currentAccount = getCurrentAccount()!;
      const previousData = getConversationDataQueryData({
        account: currentAccount,
        topic,
        context: "useToggleReadStatus",
      });

      setConversationDataQueryData({
        account: currentAccount,
        topic,
        context: "useToggleReadStatus",
        data: {
          readUntil: new Date().getTime(),
          markedAsUnread: false,
        },
      });

      return { previousData };
    },
    onError: (error, _, context) => {
      const currentAccount = getCurrentAccount()!;
      setConversationDataQueryData({
        account: currentAccount,
        topic,
        context: "useToggleReadStatus",
        data: context?.previousData,
      });
    },
  });

  const { mutateAsync: markAsUnreadAsync } = useMutation({
    mutationFn: async () => {
      const currentAccount = getCurrentAccount()!;
      await markTopicAsUnread({
        account: currentAccount,
        topic,
      });
    },
    onMutate: () => {
      const currentAccount = getCurrentAccount()!;
      const previousData = getConversationDataQueryData({
        account: currentAccount,
        topic,
        context: "useToggleReadStatus",
      });

      setConversationDataQueryData({
        account: currentAccount,
        topic,
        context: "useToggleReadStatus",
        data: {
          markedAsUnread: true,
        },
      });

      return { previousData };
    },
    onError: (error, _, context) => {
      const currentAccount = getCurrentAccount()!;
      setConversationDataQueryData({
        account: currentAccount,
        topic,
        context: "useToggleReadStatus",
        data: context?.previousData,
      });
    },
  });

  const toggleReadStatusAsync = useCallback(async () => {
    const currentAccount = getCurrentAccount()!;
    const conversationData = getConversationDataQueryData({
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
