import { getSendersSpamScores } from "../../../utils/api";
import { URL_REGEX } from "../../../utils/regex";
import { isContentType } from "../../../utils/xmtpRN/contentTypes";
import { getRepository } from "../../db";
import { getChatStore } from "../../store/accountsStore";
import { XmtpConversationWithUpdate } from "../../store/chatStore";

export interface TopicSpamScores {
  [topic: string]: number;
}

export const saveSpamScores = async (
  account: string,
  topicSpamScores: TopicSpamScores
) => {
  const conversationRepository = await getRepository(account, "conversation");
  // Let's update by batch
  let batch: string[] = [];
  let rest = Object.keys(topicSpamScores);
  while (rest.length > 0) {
    batch = rest.slice(0, 5000);
    rest = rest.slice(5000);
    let query = `UPDATE "conversation" SET "spamScore" = (case `;
    const parameters = [] as any[];
    batch.forEach((topic) => {
      const spamScore = topicSpamScores[topic];
      query = `${query}WHEN "topic" = ? THEN ? `;
      parameters.push(topic);
      parameters.push(spamScore);
    });
    query = `${query} end)
    WHERE "topic" IN (${batch.map(() => "?").join(",")})`;
    // Re-add topics to parameters for where clause
    batch.forEach((topic) => {
      parameters.push(topic);
    });
    await conversationRepository.query(query, parameters);
  }

  // Update Zustand
  const chatStore = getChatStore(account).getState();
  chatStore.setSpamScores(topicSpamScores);
};

export const refreshAllSpamScores = async (account: string) => {
  const { conversations } = getChatStore(account).getState();
  const conversationsWithoutScore = Object.values(conversations).filter(
    (c) => c.spamScore === undefined || c.spamScore === null
  );

  if (conversationsWithoutScore.length === 0) return;

  await computeConversationsSpamScores(account, conversationsWithoutScore);
};

export const computeConversationsSpamScores = async (
  account: string,
  conversations: XmtpConversationWithUpdate[]
) => {
  const conversationsPeerAddresses = new Set(
    conversations.filter((c) => !!c.peerAddress).map((c) => c.peerAddress)
  );
  const sendersSpamScores = await getSendersSpamScores(
    Array.from(conversationsPeerAddresses)
  );
  const topicSpamScores: TopicSpamScores = {};

  conversations.forEach((conversation) => {
    const senderSpamScore = sendersSpamScores[conversation.peerAddress];
    if (!conversation.messagesIds.length && senderSpamScore) {
      // Cannot score an empty conversation further, score is just the
      // sender spam score
      topicSpamScores[conversation.topic] = senderSpamScore;
      return;
    }

    const firstMessage = conversation.messages.get(conversation.messagesIds[0]);
    if (firstMessage) {
      const firstMessageSpamScore = computeSpamScore(
        firstMessage.content,
        firstMessage.sentViaConverse,
        firstMessage.contentType
      );

      topicSpamScores[conversation.topic] = senderSpamScore
        ? senderSpamScore + firstMessageSpamScore
        : firstMessageSpamScore;
    }
  });
  await saveSpamScores(account, topicSpamScores);
};

const computeSpamScore = (
  message: string,
  sentViaConverse: boolean,
  contentType: string
): number => {
  let spamScore: number = 0.0;

  URL_REGEX.lastIndex = 0;

  if (isContentType("text", contentType) && URL_REGEX.test(message)) {
    spamScore += 1;
  }
  if (sentViaConverse) {
    spamScore -= 1;
  }
  return spamScore;
};
