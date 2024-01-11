import uuid from "react-native-uuid";

import { saveMessages } from "../data/helpers/messages";
import {
  currentAccount,
  getTransactionsStore,
} from "../data/store/accountsStore";
import { XmtpConversation } from "../data/store/chatStore";
import { getTransactionDetails } from "./api";
import { saveAttachmentForPendingMessage } from "./attachment";
import { mergeTransactionRefData } from "./transaction";
import { isContentType } from "./xmtpRN/contentTypes";
import { sendPendingMessages } from "./xmtpRN/send";

type SendMessageInput = {
  conversation: XmtpConversation;
  content: string;
  contentType: string;
  contentFallback?: string | undefined;
  referencedMessageId?: string | undefined;
  attachmentToSave?: {
    filePath: string;
    mimeType: string | null;
    fileName: string;
  };
};

export const sendMessage = async ({
  conversation,
  content,
  contentType,
  contentFallback,
  referencedMessageId,
  attachmentToSave,
}: SendMessageInput) => {
  if (!conversation) return;
  const messageId = uuid.v4().toString();
  const sentAtTime = new Date();
  const isV1Conversation = conversation.topic.startsWith("/xmtp/0/dm-");

  if (isContentType("remoteAttachment", contentType) && attachmentToSave) {
    // Let's move file to attachments folder right now!
    await saveAttachmentForPendingMessage(
      messageId,
      attachmentToSave.filePath,
      attachmentToSave.fileName,
      attachmentToSave.mimeType
    );
  }

  if (isContentType("transactionReference", contentType)) {
    const transactionRef = JSON.parse(content);
    const { namespace, networkId, reference: txHash } = transactionRef;

    // Handle Ethereum chain IDs, fetch details and save to Zustand
    if (namespace === "eip155" && networkId && txHash) {
      const details = await getTransactionDetails(
        currentAccount(),
        networkId,
        txHash
      );
      const transactionStore = getTransactionsStore(currentAccount());
      const transaction = mergeTransactionRefData(transactionRef, details);
      transactionStore.getState().setTransactions([transaction]);
    }
  }

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
