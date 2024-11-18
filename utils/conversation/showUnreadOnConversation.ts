import { TopicsData } from "@data/store/chatStore";
import {
  ConversationWithCodecsType,
  DecodedMessageWithCodecsType,
} from "@utils/xmtpRN/client";

export const showUnreadOnConversation = (
  initialLoadDoneOnce: boolean,
  lastMessagePreview: DecodedMessageWithCodecsType | undefined,
  topicsData: TopicsData,
  conversation: ConversationWithCodecsType,
  userAddress: string
) => {
  if (!initialLoadDoneOnce) return false;
  if (!lastMessagePreview) return false;
  // Manually marked as unread
  if (topicsData[conversation.topic]?.status === "unread") return true;
  // If not manually markes as unread, we only show badge if last message
  // not from me
  if (
    lastMessagePreview.senderAddress.toLowerCase() === userAddress.toLowerCase()
  )
    return false;
  const readUntil = topicsData[conversation.topic]?.readUntil || 0;
  return readUntil < lastMessagePreview.sentNs;
};
