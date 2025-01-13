import { getCurrentAccount } from "@/data/store/accountsStore";
import { conversationIsUnread } from "@/features/conversation/utils/conversation-is-unread-by-current-account";
import {
  getConversationDataQueryData,
  getOrFetchConversationData,
  setConversationDataQueryData,
} from "@/queries/use-conversation-data-query";
import { getConversationQueryData } from "@/queries/useConversationQuery";
import { markTopicAsRead, markTopicAsUnread } from "@/utils/api/topics";
import { captureError, captureErrorWithToast } from "@/utils/capture-error";
import { useMutation } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { useCallback } from "react";

type UseToggleReadStatusProps = {
  topic: ConversationTopic;
};

export const useToggleReadStatus = ({ topic }: UseToggleReadStatusProps) => {
  const { mutateAsync: markConversationAsReadAsync } = useMutation({
    mutationFn: async () => {
      const currentAccount = getCurrentAccount();
      const [conversationData, conversation] = await Promise.all([
        getOrFetchConversationData({
          account: currentAccount!,
          topic,
        }),
        getConversationQueryData({
          account: currentAccount!,
          topic,
        }),
      ]);

      const _conversationIsUnread = conversationIsUnread({
        lastMessageSent: conversation?.lastMessage?.sentNs ?? 0,
        readUntil: conversationData?.readUntil ?? 0,
      });

      if (_conversationIsUnread) {
        await markTopicAsRead({
          account: currentAccount!,
          topic,
          readUntil: new Date().getTime(),
        });
      } else {
        await markTopicAsUnread({
          account: currentAccount!,
          topic,
        });
      }
    },
    onMutate: () => {
      const currentAccount = getCurrentAccount();
      const previousReadUntil = getConversationDataQueryData({
        account: currentAccount!,
        topic,
      })?.readUntil;

      setConversationDataQueryData({
        account: currentAccount!,
        topic,
        data: {
          readUntil: new Date().getTime(),
        },
      });

      return { previousReadUntil };
    },
    onError: (error, _, context) => {
      const currentAccount = getCurrentAccount();
      captureError(error);
      setConversationDataQueryData({
        account: currentAccount!,
        topic,
        data: {
          readUntil: context?.previousReadUntil,
        },
      });
      captureErrorWithToast(error);
    },
  });

  const toggleReadStatusAsync = useCallback(async () => {
    try {
      await markConversationAsReadAsync();
    } catch (error) {
      captureErrorWithToast(error);
    }
  }, [markConversationAsReadAsync]);

  return { toggleReadStatusAsync };
};
