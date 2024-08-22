import { TopicsData } from "@data/store/chatStore";
import {
  ConversationWithLastMessagePreview,
  LastMessagePreview,
} from "@utils/conversation";

export const showUnreadOnConversation = (
  initialLoadDoneOnce: boolean,
  lastMessagePreview: LastMessagePreview | undefined,
  topicsData: TopicsData,
  conversation: ConversationWithLastMessagePreview,
  userAddress: string
) => {
  if (!initialLoadDoneOnce) return false;
  if (!lastMessagePreview) return false;
  // Manually marked as unread
  if (topicsData[conversation.topic]?.status === "unread") return true;
  // If not manually markes as unread, we only show badge if last message
  // not from me
  if (lastMessagePreview.message.senderAddress === userAddress) return false;
  const readUntil = topicsData[conversation.topic]?.readUntil || 0;
  return readUntil < lastMessagePreview.message.sent;
};
