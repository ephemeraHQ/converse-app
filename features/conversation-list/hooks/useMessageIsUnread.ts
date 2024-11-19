import { useMemo } from "react";
import { TopicsData } from "@data/store/chatStore";
import {
  ConversationWithCodecsType,
  DecodedMessageWithCodecsType,
} from "@utils/xmtpRN/client";

type UseConversationIsUnreadProps = {
  topicsData: TopicsData;
  topic: string;
  lastMessage: DecodedMessageWithCodecsType | undefined;
  conversation: ConversationWithCodecsType;
  timestamp: number;
};

export const useConversationIsUnread = ({
  topicsData,
  topic,
  lastMessage,
  conversation,
  timestamp,
}: UseConversationIsUnreadProps) => {
  return useMemo(() => {
    if (topicsData[topic]?.status === "unread") {
      return true;
    }
    if (lastMessage?.senderAddress === conversation?.client.inboxId) {
      return false;
    }
    const readUntil = topicsData[topic]?.readUntil || 0;
    return readUntil < (timestamp ?? 0);
  }, [
    topicsData,
    topic,
    lastMessage?.senderAddress,
    conversation?.client.inboxId,
    timestamp,
  ]);
};
