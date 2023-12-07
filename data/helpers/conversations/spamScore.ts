import { URL_REGEX } from "../../../utils/regex";
import { isContentType } from "../../../utils/xmtpRN/contentTypes";
import { getRepository } from "../../db";
import { getChatStore } from "../../store/accountsStore";
import { XmtpConversationWithUpdate } from "../../store/chatStore";

export interface TopicSpamScores {
  [key: string]: number;
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
    query = `${query} end)`;
    await conversationRepository.query(query, parameters);
  }

  // Update Zustand
  const chatStore = getChatStore(account).getState();
  chatStore.setSpamScores(topicSpamScores);
};

export const refreshAllSpamScores = async (account: string) => {
  const { conversations } = getChatStore(account).getState();
  const topicSpamScores: TopicSpamScores = {};

  // Array to hold promises for spam scores computations
  const spamScorePromises = Object.entries(conversations).map(
    async ([topic, conversation]) => {
      if (
        conversation.spamScore !== undefined &&
        conversation.spamScore !== null
      ) {
        return;
      }

      try {
        const spamScore = await handleSpamScore(account, conversation, false);
        if (spamScore !== null) {
          topicSpamScores[topic] = spamScore;
        }
      } catch (error) {
        console.error(
          `Error calculating spam score for topic ${topic}:`,
          error
        );
      }
    }
  );

  // Wait for all spam scores to be handled
  await Promise.all(spamScorePromises);

  if (Object.keys(topicSpamScores).length > 0) {
    await saveSpamScores(account, topicSpamScores);
  }
};

export const handleSpamScore = async (
  account: string,
  conversation: XmtpConversationWithUpdate,
  saveImmediately: boolean = true
): Promise<number | null> => {
  if (!conversation.messagesIds.length) {
    // Cannot score an empty conversation
    return null;
  }

  const firstMessage = conversation.messages.get(conversation.messagesIds[0]);
  if (firstMessage) {
    const spamScore = await computeSpamScore(
      conversation.peerAddress,
      firstMessage.content,
      firstMessage.sentViaConverse,
      firstMessage.contentType
    );

    if (saveImmediately) {
      const topicSpamScore: TopicSpamScores = {
        [conversation.topic]: spamScore,
      };
      await saveSpamScores(account, topicSpamScore);
    }

    return spamScore;
  }

  return null;
};

const computeSpamScore = async (
  address: string,
  message: string,
  sentViaConverse: boolean,
  contentType: string
): Promise<number> => {
  let spamScore: number = 0.0;

  URL_REGEX.lastIndex = 0;
  const containsUrl = URL_REGEX.test(message);

  if (isContentType("text", contentType) && containsUrl) {
    spamScore += 1;
  }
  if (sentViaConverse) {
    spamScore -= 1;
  }
  return spamScore;
};
