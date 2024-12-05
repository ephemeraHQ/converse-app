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

  console.log("useToggleReadStatus", topic, isUnread);

  return useCallback(() => {
    const newStatus = isUnread ? "read" : "unread";
    console.log("newStatus:", newStatus);
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
