import { getSendersSpamScores } from "../../../utils/api";
import { URL_REGEX } from "../../../utils/regex";
import { isContentType } from "../../../utils/xmtpRN/contentTypes";
import { getRepository } from "../../db";
import { maxVariableCount } from "../../db/upsert";
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
  // There are 3 ? per topic (1 for topic and spam score, and one for topic WHERE)
  const SLICE_SIZE = Math.floor(maxVariableCount / 3);
  while (rest.length > 0) {
    batch = rest.slice(0, SLICE_SIZE);
    rest = rest.slice(SLICE_SIZE);
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
  const conversationsToScore = Object.values(conversations).filter(
    (c) => c.spamScore === undefined || c.spamScore === null
  );
  if (conversationsToScore.length === 0) return;
  await computeConversationsSpamScores(account, conversationsToScore);
};

export const computeConversationsSpamScores = async (
  account: string,
  conversations: XmtpConversationWithUpdate[]
) => {
  const conversationsRequesterAddresses = new Set(
    conversations
      .filter((c) => !!c.peerAddress || !!c.groupAddedBy)
      .map((c) => (c.isGroup ? c.groupAddedBy : (c.peerAddress as string)))
      .filter((address): address is string => address !== undefined)
  );
  const sendersSpamScores = await getSendersSpamScores(
    Array.from(conversationsRequesterAddresses)
  );

  const topicSpamScores: TopicSpamScores = {};

  conversations.forEach((conversation) => {
    if (!(conversation.peerAddress || conversation.groupAddedBy)) return;

    const senderKey = conversation.isGroup
      ? conversation.groupAddedBy
      : conversation.peerAddress;
    if (!senderKey) return;

    const senderSpamScore = sendersSpamScores[senderKey];
    if (
      !conversation.messagesIds.length &&
      typeof senderSpamScore === "number" &&
      // 1:1 Conversations without messages and no specific sender spam score
      // should not get a spam score now (waiting for first message)
      (conversation.isGroup || senderSpamScore !== 0)
    ) {
      // Cannot score an empty conversation further, score is just the
      // sender spam score
      topicSpamScores[conversation.topic] = senderSpamScore;
      return;
    }

    const firstMessage = conversation.messages.get(conversation.messagesIds[0]);
    if (firstMessage) {
      const firstMessageSpamScore = computeSpamScore(
        firstMessage.content,
        firstMessage.contentType
      );

      topicSpamScores[conversation.topic] = senderSpamScore
        ? senderSpamScore + firstMessageSpamScore
        : firstMessageSpamScore;
    }
  });
  await saveSpamScores(account, topicSpamScores);
};

const computeSpamScore = (message: string, contentType: string): number => {
  let spamScore: number = 0.0;

  URL_REGEX.lastIndex = 0;

  if (isContentType("text", contentType) && URL_REGEX.test(message)) {
    spamScore += 1;
  }
  return spamScore;
};
