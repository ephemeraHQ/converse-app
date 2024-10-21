import "reflect-metadata";

import {
  getChatStore,
  getProfilesStore,
} from "@features/accounts/accounts.store";
import logger from "@utils/logger";
import { getProfile } from "@utils/profile";

import { getRepository } from "./db";
import { Conversation } from "./db/entities/conversationEntity";
import { Message } from "./db/entities/messageEntity";
import { refreshProfilesIfNeeded } from "./helpers/profiles/profilesUpdate";
import { xmtpConversationFromDb } from "./mappers";
import { saveXmtpEnv, saveApiURI } from "../utils/sharedData";

const getTypeormBoolValue = (value: number) => value === 1;

export const loadDataToContext = async (account: string) => {
  // Save env to shared data with extension
  saveXmtpEnv();
  saveApiURI();
  const [conversationRepository, messageRepository] = await Promise.all([
    getRepository(account, "conversation"),
    getRepository(account, "message"),
  ]);

  // Let's load conversations and messages and save to context

  // We're using raw query builder for performance reason, typeorm mapping is kinda slow

  const conversationsWithMessages: Conversation[] = (
    await conversationRepository.createQueryBuilder().select("*").execute()
  ).map((c: any) => ({
    ...c,
    isGroup: getTypeormBoolValue(c.isGroup),
    pending: getTypeormBoolValue(c.pending),
    isActive: getTypeormBoolValue(c.isActive),
  }));

  logger.debug(
    `[InitialData] ${account}: Loading ${conversationsWithMessages.length} conversations from local db`
  );

  const conversationsMessages: Message[][] = await Promise.all(
    conversationsWithMessages.map((c) =>
      messageRepository
        .createQueryBuilder()
        .select("*")
        .where("message.conversationId = :topic", {
          topic: c.topic,
        })
        // If no limit => ASC then no reverse
        .orderBy("sent", "DESC")
        .limit(50)
        .execute()
    )
  );

  const totalMessagesCount = conversationsMessages.reduce(
    (count, conversation) => count + conversation.length,
    0
  );

  logger.debug(
    `[InitialData] ${account}: Loading ${totalMessagesCount} messages from local db`
  );

  conversationsWithMessages.forEach((conversation, index) => {
    // If no limit => ASC then no reverse
    conversation.messages = conversationsMessages[index]
      .map((m) => ({
        ...m,
        converseMetadata: m.converseMetadata
          ? JSON.parse(m.converseMetadata as any)
          : undefined,
      }))
      .reverse();
  });

  const profilesByAddress = getProfilesStore(account).getState().profiles;
  getChatStore(account)
    .getState()
    .setConversations(
      conversationsWithMessages.map((c) =>
        xmtpConversationFromDb(
          account,
          c,
          c.peerAddress
            ? getProfile(c.peerAddress, profilesByAddress)?.socials
            : undefined
        )
      )
    );

  refreshProfilesIfNeeded(account);
};
