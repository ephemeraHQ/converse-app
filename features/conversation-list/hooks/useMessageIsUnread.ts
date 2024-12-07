import { useMemo } from "react";
import { ChatStoreType } from "@data/store/chatStore";
import {
  ConversationWithCodecsType,
  DecodedMessageWithCodecsType,
} from "@utils/xmtpRN/client";
import { useChatStore } from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";
import { normalizeTimestamp } from "@/utils/date";

type UseConversationIsUnreadProps = {
  topic: string;
  lastMessage: DecodedMessageWithCodecsType | undefined;
  conversation: ConversationWithCodecsType;
  timestamp: number;
};

const chatStoreSelectKeys: (keyof ChatStoreType)[] = ["topicsData"];

export const useConversationIsUnread = ({
  topic,
  lastMessage,
  conversation,
  timestamp: timestampNs,
}: UseConversationIsUnreadProps) => {
  const { topicsData } = useChatStore(useSelect(chatStoreSelectKeys));

  return useMemo(() => {
    if (topicsData[topic]?.status === "unread") {
      return true;
    }
    // Return false because current user sent the last message)
    if (lastMessage?.senderAddress === conversation?.client.inboxId) {
      return false;
    }
    const timestamp = normalizeTimestamp(timestampNs);
    const readUntil = topicsData[topic]?.readUntil || 0;

    // Return true if the last message timestamp is greater than readUntil
    return readUntil < (timestamp ?? 0);
  }, [
    topicsData,
    topic,
    lastMessage?.senderAddress,
    conversation?.client.inboxId,
    timestampNs,
  ]);
};
