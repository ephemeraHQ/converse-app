import logger from "@utils/logger";
import { In } from "typeorm/browser";

import { upgradePendingConversationsIfNeeded } from "./pendingConversations";
import { computeConversationsSpamScores } from "./spamScore";
import {
  navigateToTopicWithRetry,
  topicToNavigateTo,
} from "../../../utils/navigation";
import { getRepository } from "../../db";
import { getExistingDataSource } from "../../db/datasource";
import { Conversation } from "../../db/entities/conversationEntity";
import { upsertRepository } from "../../db/upsert";
import { xmtpConversationToDb } from "../../mappers";
import { getChatStore } from "../../store/accountsStore";
import {
  XmtpConversation,
  XmtpConversationWithUpdate,
} from "../../store/chatStore";
import { refreshProfilesIfNeeded } from "../profiles/profilesUpdate";

export const saveConversations = async (
  account: string,
  conversations: XmtpConversation[],
  forceUpdate = false
) => {
  if (conversations.length === 0) return;
  logger.debug(
    `Calling saveConversations for ${account} with ${
      conversations.length
    } convos and ${forceUpdate ? "forceUpdate" : "no forceUpdate"}`
  );
  const chatStoreState = getChatStore(account).getState();
  const alreadyKnownConversations: XmtpConversation[] = [];
  const conversationsToUpsert: XmtpConversation[] = [];
  conversations.forEach((c) => {
    if (!chatStoreState.conversations[c.topic] || forceUpdate) {
      conversationsToUpsert.push(c);
    } else {
      alreadyKnownConversations.push(c);
    }
  });

  // Save immediatly to db the new ones
  const newlySavedConversations = await setupAndSaveConversations(
    account,
    conversationsToUpsert
  );
  // Then to context so it show immediatly even without handle
  if (newlySavedConversations.length > 0) {
    chatStoreState.setConversations(newlySavedConversations);
  }
  refreshProfilesIfNeeded(account);

  // Navigate to conversation from push notification on first message
  if (topicToNavigateTo) {
    navigateToTopicWithRetry();
  }
};

const setupAndSaveConversations = async (
  account: string,
  conversations: XmtpConversation[]
): Promise<XmtpConversation[]> => {
  if (conversations.length === 0) return [];
  // If there are here conversations newly created that correspond to
  // pending convos in our local db, let's update them
  await upgradePendingConversationsIfNeeded(account, conversations);

  const conversationRepository = await getRepository(account, "conversation");
  const alreadyConversationInDbWithTopics = await conversationRepository.find({
    where: { topic: In(conversations.map((c) => c.topic)) },
  });
  const alreadyConversationsByTopic: {
    [topic: string]: Conversation | undefined;
  } = {};
  alreadyConversationInDbWithTopics.forEach((c) => {
    alreadyConversationsByTopic[c.topic] = c;
  });

  const conversationsToUpsert: Conversation[] = [];
  conversations.forEach((conversation) => {
    const alreadyConversationInDbWithTopic =
      alreadyConversationsByTopic[conversation.topic];

    // If spam score is not computed, compute it
    if (
      conversation.spamScore === undefined ||
      conversation.spamScore === null
    ) {
      logger.debug("Empty spam score, computing...");
      computeConversationsSpamScores(account, [
        conversation as XmtpConversationWithUpdate,
      ]);
    }

    conversation.readUntil =
      conversation.readUntil ||
      alreadyConversationInDbWithTopic?.readUntil ||
      0;

    conversationsToUpsert.push(xmtpConversationToDb(conversation));
  });

  // Let's save by batch to avoid hermes issues
  let batch: Conversation[] = [];
  let rest = conversationsToUpsert;
  while (rest.length > 0) {
    batch = rest.slice(0, 5000);
    rest = rest.slice(5000);
    await upsertRepository(conversationRepository, batch, ["topic"], false);
  }

  return conversations;
};

export const markAllConversationsAsReadInDb = async (account: string) => {
  const dataSource = getExistingDataSource(account);
  if (!dataSource) return;
  await dataSource.query(
    `UPDATE "conversation" SET "readUntil" = (SELECT COALESCE(MAX(sent), 0) FROM "message" WHERE "message"."conversationId" = "conversation"."topic")`
  );
};

export const markConversationReadUntil = async (
  account: string,
  topic: string,
  readUntil: number
) => {
  const conversationRepository = await getRepository(account, "conversation");
  await conversationRepository.update({ topic }, { readUntil });
};

export const saveConversationsLastNotificationSubscribePeriod = async (
  account: string,
  topics: string[],
  period: number
) => {
  getChatStore(account)
    .getState()
    .setConversationsLastNotificationSubscribePeriod(topics, period);
  const conversationRepository = await getRepository(account, "conversation");
  await conversationRepository.update(
    { topic: In(topics) },
    { lastNotificationsSubscribedPeriod: period }
  );
};
