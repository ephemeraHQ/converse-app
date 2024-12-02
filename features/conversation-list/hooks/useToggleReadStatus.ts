import { useChatStore } from "@/data/store/accountsStore";
import { useSelect } from "@/data/store/storeHelpers";
import { saveTopicsData } from "@utils/api";
import { useCallback } from "react";

type UseToggleReadStatusProps = {
  topic: string;
  isUnread: boolean;
  currentAccount: string;
};

export const useToggleReadStatus = ({
  topic,
  isUnread,
  currentAccount,
}: UseToggleReadStatusProps) => {
  const { setTopicsData } = useChatStore(useSelect(["setTopicsData"]));

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
