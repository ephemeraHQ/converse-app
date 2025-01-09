import { useChatStore, useCurrentInboxId } from "@/data/store/accountsStore";
import { useSelect } from "@/data/store/storeHelpers";
import logger from "@/utils/logger";
import { saveTopicsData } from "@utils/api";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { useCallback } from "react";

type UseToggleReadStatusPropsForCurrentUser = {
  topic: ConversationTopic;
  isUnread: boolean;
};

export const useToggleReadStatusForCurrentUser = ({
  topic,
  isUnread,
}: UseToggleReadStatusPropsForCurrentUser) => {
  const currentInboxId = useCurrentInboxId();
  const { setTopicsData } = useChatStore(useSelect(["setTopicsData"]));
  return useCallback(() => {
    if (!currentInboxId) {
      logger.warn(
        "[useToggleReadStatusForCurrentUser] No current inboxId; noop"
      );
      return;
    }
    const newStatus = isUnread ? "read" : "unread";
    const timestamp = new Date().getTime();
    setTopicsData({
      [topic]: {
        status: newStatus,
        readUntil: isUnread ? timestamp : 0,
        timestamp,
      },
    });
    saveTopicsData({
      inboxId: currentInboxId,
      topicsData: {
        [topic]: {
          status: newStatus,
          readUntil: isUnread ? timestamp : 0,
          timestamp,
        },
      },
    });
  }, [setTopicsData, topic, isUnread, currentInboxId]);
};
