import { URL_REGEX } from "../../../utils/regex";
import { getRepository } from "../../db";
import { getChatStore, getSettingsStore } from "../../store/accountsStore";
import { XmtpConversationWithUpdate } from "../../store/chatStore";
interface TopicSpamScores {
  [key: string]: number;
}

export const saveSpamScores = async (
  account: string,
  topicSpamScores: Record<string, number>
) => {
  const conversationRepository = await getRepository(account, "conversation");

  console.log(">> saveSpamScores:", topicSpamScores);

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

  console.log(">> Zustand setSpamScores");

  // Update Zustand
  const chatStore = getChatStore(account).getState();
  chatStore.setSpamScores(topicSpamScores);
};

export const updateAllSpamScores = async (account: string) => {
  const { conversations } = getChatStore(account).getState();
  const peersStatus = getSettingsStore(account).getState().peersStatus;

  console.log(">> updateAllSpamScores() for account:", account);

  const topicSpamScores: TopicSpamScores = {};

  const spamScorePromises = [];

  for (const [topic, conversation] of Object.entries(conversations)) {
    const peerStatus = peersStatus[conversation.peerAddress.toLowerCase()];

    if (
      !conversation.hasOneMessageFromMe &&
      conversation.spamScore === undefined &&
      peerStatus !== "blocked" &&
      peerStatus !== "consented"
    ) {
      // Push the promise of handleSpamScore into the array, without saving
      spamScorePromises.push(
        handleSpamScore(account, conversation, false).then((spamScore) => {
          if (spamScore !== null) {
            topicSpamScores[topic] = spamScore;
          }
        })
      );
    }
  }

  console.log(">> topicSpamScores:", topicSpamScores);

  // Wait for all spam scores to be handled
  await Promise.all(spamScorePromises);

  // Save all spam scores at once if there are any to save
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
    console.warn("No message ID found in the conversation");
    return 0;
  }

  console.log(
    "!! handleSpamScore for topic with peer",
    conversation.peerAddress
  );

  const firstMessage = conversation.messages.get(conversation.messagesIds[0]);
  if (firstMessage) {
    const spamScore = await computeSpamScore(
      conversation.peerAddress,
      firstMessage.content,
      firstMessage.sentViaConverse,
      firstMessage.contentType
    );

    console.log(
      ">>",
      spamScore,
      "- computed spam score for the topic:",
      conversation.topic
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
  if (contentType.startsWith("xmtp.org/text:") && URL_REGEX.test(message)) {
    spamScore += 1;
  }
  if (sentViaConverse) {
    spamScore -= 1;
  }
  return spamScore;
};
