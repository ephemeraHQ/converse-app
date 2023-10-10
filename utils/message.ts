import uuid from "react-native-uuid";

import { saveMessages } from "../data/helpers/messages";
import { currentAccount } from "../data/store/accountsStore";
import { XmtpConversation } from "../data/store/chatStore";
import { sendPendingMessages } from "./xmtpRN/send";

export const sendMessage = async (
  conversation: XmtpConversation,
  content: string,
  contentType = "xmtp.org/text:1.0",
  contentFallback = undefined as string | undefined,
  referencedMessageId = undefined as string | undefined
) => {
  if (!conversation) return;
  const messageId = uuid.v4().toString();
  const sentAtTime = new Date();
  const isV1Conversation = conversation.topic.startsWith("/xmtp/0/dm-");
  // Save to DB immediatly
  await saveMessages(currentAccount(), [
    {
      id: messageId,
      senderAddress: currentAccount(),
      sent: sentAtTime.getTime(),
      content,
      status: "sending",
      sentViaConverse: !isV1Conversation, // V1 Convo don't support the sentViaConverse feature
      contentType,
      contentFallback,
      referencedMessageId,
      topic: conversation.topic,
    },
  ]);
  // Then send for real if conversation exists
  if (!conversation.pending) {
    sendPendingMessages(currentAccount());
  }
};
