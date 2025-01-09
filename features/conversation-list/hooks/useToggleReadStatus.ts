import { useChatStore, useCurrentAccount } from "@/data/store/accountsStore";
import { useSelect } from "@/data/store/storeHelpers";
import { useConversationIsUnreadByTopic } from "@/features/conversation-list/hooks/use-conversation-is-unread";
import { saveTopicsData } from "@utils/api";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { useCallback } from "react";

type UseToggleReadStatusProps = {
  topic: ConversationTopic;
};

export const useToggleReadStatus = ({ topic }: UseToggleReadStatusProps) => {
  const currentAccount = useCurrentAccount()!;
  const { setTopicsData } = useChatStore(useSelect(["setTopicsData"]));
  const isUnread = useConversationIsUnreadByTopic({ topic });

  return useCallback(() => {
    const newStatus = isUnread ? "read" : "unread";
    const timestamp = new Date().getTime();
    setTopicsData({
      [topic]: {
        status: newStatus,
        readUntil: isUnread ? timestamp : 0,
        timestamp,
      },
    });
    saveTopicsData(currentAccount, {
      [topic]: {
        status: newStatus,
        readUntil: isUnread ? timestamp : 0,
        timestamp,
      },
    });
  }, [setTopicsData, topic, isUnread, currentAccount]);
};
