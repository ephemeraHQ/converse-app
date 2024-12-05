import { useMemo } from "react";
import { ChatStoreType, TopicsData } from "@data/store/chatStore";
import {
  ConversationWithCodecsType,
  DecodedMessageWithCodecsType,
} from "@utils/xmtpRN/client";
import {
  currentAccount,
  useChatStore,
  useCurrentAccount,
} from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";
import { normalizeTimestamp } from "@/utils/date";
import { useDmPeerInboxId } from "@/queries/useDmPeerInbox";
import { useConversationCurrentTopic } from "@/features/conversation/conversation-service";
import { ConversationTopic } from "@xmtp/react-native-sdk";

type UseConversationIsUnreadProps = {
  topic: string;
  lastMessage: DecodedMessageWithCodecsType | undefined;
  timestamp: number;
  /**
   * @deprecated This prop has been deprecated.
   * for backward compatibility only
   */
  conversation?: ConversationWithCodecsType;
};

const chatStoreSelectKeys: (keyof ChatStoreType)[] = ["topicsData"];

export const useConversationIsUnread = ({
  topic,
  lastMessage,
  timestamp: timestampNs,
}: UseConversationIsUnreadProps) => {
  const currentAccount = useCurrentAccount()!;

  const validTopic: ConversationTopic = "valid-topic" as ConversationTopic;

  const topicsData = useChatStore((state: ChatStoreType) => state.topicsData);
  const { data: peerInboxId } = useDmPeerInboxId(currentAccount, validTopic);

  return useMemo(() => {
    if (!lastMessage) return false;
    if (topicsData[topic]?.status === "unread") return true;
    // Don't mark as unread if message is from peer
    if (lastMessage.senderAddress === peerInboxId) {
      return false;
    }
    const timestamp = normalizeTimestamp(timestampNs);
    const readUntil = topicsData[topic]?.readUntil || 0;
    return readUntil < (timestamp ?? 0);
  }, [topicsData, topic, timestampNs, lastMessage, peerInboxId]);
};
