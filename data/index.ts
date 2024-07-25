import "reflect-metadata";

import { getRepository } from "./db";
import { Conversation } from "./db/entities/conversationEntity";
import { Message } from "./db/entities/messageEntity";
import { loadProfilesByAddress } from "./helpers/profiles";
import { xmtpConversationFromDb } from "./mappers";
import { getChatStore, getProfilesStore } from "./store/accountsStore";
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

  const profilesByAddress = await loadProfilesByAddress(account);
  getProfilesStore(account).getState().setProfiles(profilesByAddress);
  getChatStore(account)
    .getState()
    .setConversations(
      conversationsWithMessages.map((c) =>
        xmtpConversationFromDb(
          account,
          c,
          c.peerAddress ? profilesByAddress[c.peerAddress]?.socials : undefined
        )
      )
    );
};
