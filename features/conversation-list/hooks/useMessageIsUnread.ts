import { useMemo } from "react";
import { ChatStoreType } from "@data/store/chatStore";
import { DecodedMessageWithCodecsType } from "@utils/xmtpRN/client";
import { useChatStore, useCurrentAccount } from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";
import { normalizeTimestamp } from "@/utils/date";
import { getCurrentUserAccountInboxId } from "@/hooks/use-current-account-inbox-id";

type UseConversationIsUnreadProps = {
  topic: string;
  lastMessage: DecodedMessageWithCodecsType | undefined;
  timestampNs: number;
};

const chatStoreSelectKeys: (keyof ChatStoreType)[] = ["topicsData"];

export const useConversationIsUnread = ({
  topic,
  lastMessage,
  timestampNs,
}: UseConversationIsUnreadProps) => {
  const { topicsData } = useChatStore(useSelect(chatStoreSelectKeys));
  const currentInboxId = getCurrentUserAccountInboxId();

  return useMemo(() => {
    // No message means no unread status
    if (!lastMessage) return false;

    // Check if status is unread
    if (topicsData[topic]?.status === "unread") return true;

    // Check if the last message was sent by the current user
    if (lastMessage.senderAddress === currentInboxId) {
      return false;
    }

    const timestamp = normalizeTimestamp(timestampNs);
    const readUntil = topicsData[topic]?.readUntil || 0;

    // Return true if the last message timestamp is greater than readUntil
    return readUntil < (timestamp ?? 0);
  }, [topicsData, topic, timestampNs, lastMessage, currentInboxId]);
};
