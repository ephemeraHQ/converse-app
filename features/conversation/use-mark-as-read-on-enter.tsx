import { useEffect, useRef } from "react";

export const useMarkAsReadOnEnter = ({
  messagesLoading,
  isUnread,
  toggleReadStatus,
}: {
  messagesLoading: boolean;
  isUnread: boolean;
  toggleReadStatus: () => void;
}) => {
  const hasMarkedAsRead = useRef(false);

  useEffect(() => {
    if (isUnread && !messagesLoading && !hasMarkedAsRead.current) {
      toggleReadStatus();
      hasMarkedAsRead.current = true;
    }
  }, [isUnread, messagesLoading, toggleReadStatus]);
};
