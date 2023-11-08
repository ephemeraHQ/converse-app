import { URL_REGEX } from "../../../utils/regex";
import { getRepository } from "../../db";
import { getChatStore, getSettingsStore } from "../../store/accountsStore";
import { XmtpConversationWithUpdate } from "../../store/chatStore";

export interface TopicSpamScores {
  [key: string]: number;
}

export const saveSpamScores = async (
  account: string,
  topicSpamScores: TopicSpamScores
) => {
  const conversationRepository = await getRepository(account, "conversation");

  await conversationRepository.manager.transaction(
    async (transactionalEntityManager) => {
      for (const [topic, spamScore] of Object.entries(topicSpamScores)) {
        await transactionalEntityManager.update(
          conversationRepository.target,
          { topic },
          { spamScore }
        );
      }
    }
  );

  // Update Zustand
  const chatStore = getChatStore(account).getState();
  chatStore.setSpamScores(topicSpamScores);
};

export const updateAllSpamScores = async (account: string) => {
  const { conversations } = getChatStore(account).getState();
  const { peersStatus } = getSettingsStore(account).getState();

  const topicSpamScores: TopicSpamScores = {};

  // Array to hold promises for spam score calculations
  const spamScorePromises = Object.entries(conversations).map(
    async ([topic, conversation]) => {
      const peerStatus = peersStatus[conversation.peerAddress.toLowerCase()];

      if (
        conversation.spamScore !== undefined &&
        conversation.spamScore !== null
      ) {
        // If spamScore is already defined, no need to re-compute
      } else if (
        conversation.hasOneMessageFromMe ||
        peerStatus === "consented"
      ) {
        // For consented and conversations with user participation, set a negative spamScore
        topicSpamScores[topic] = -1;
      } else if (peerStatus === "blocked") {
        // For blocked conversations, set a positive spamScore
        topicSpamScores[topic] = 1;
      } else {
        // Only calculate spamScore if it's undefined
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
    }
  );

  // Wait for all spam scores to be handled
  await Promise.all(spamScorePromises);

  if (Object.keys(topicSpamScores).length > 0) {
    saveSpamScores(account, topicSpamScores);
  }
};

export const handleSpamScore = async (
  account: string,
  conversation: XmtpConversationWithUpdate,
  saveImmediately: boolean = true
): Promise<number | null> => {
  if (!conversation.messagesIds.length) {
    console.warn(
      "No message ID found:",
      conversation.topic,
      "with:",
      conversation.peerAddress
    );
    return 0;
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
      saveSpamScores(account, topicSpamScore);
    } else {
      return spamScore;
    }
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

  if (contentType.startsWith("xmtp.org/text:") && containsUrl) {
    spamScore += 1;
  }
  if (sentViaConverse) {
    spamScore -= 1;
  }
  return spamScore;
};
