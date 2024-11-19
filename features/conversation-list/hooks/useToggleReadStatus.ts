import { TopicStatus } from "@data/store/chatStore";
import { saveTopicsData } from "@utils/api";
import { useCallback } from "react";

type UseToggleReadStatusProps = {
  setTopicsData: (
    data: Record<string, { status: TopicStatus; timestamp: number }>
  ) => void;
  topic: string;
  isUnread: boolean;
  currentAccount: string;
};

export const useToggleReadStatus = ({
  setTopicsData,
  topic,
  isUnread,
  currentAccount,
}: UseToggleReadStatusProps) => {
  return useCallback(() => {
    const newStatus = isUnread ? "read" : "unread";
    const timestamp = new Date().getTime();
    setTopicsData({
      [topic]: {
        status: newStatus,
        timestamp,
      },
    });
    saveTopicsData(currentAccount, {
      [topic]: {
        status: newStatus,
        timestamp,
      },
    });
  }, [setTopicsData, topic, isUnread, currentAccount]);
};
