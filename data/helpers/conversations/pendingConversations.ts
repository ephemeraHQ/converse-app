import logger from "@utils/logger";
import { InvitationContext } from "@xmtp/xmtp-js";
import { Alert, Platform } from "react-native";
import { In } from "typeorm/browser";
import { v4 as uuidv4 } from "uuid";

import { saveConversations } from "./upsertConversations";
import { getCleanAddress } from "../../../utils/evm/address";
import { getRepository } from "../../db";
import { Conversation } from "../../db/entities/conversationEntity";
import { upsertRepository } from "../../db/upsert";
import { xmtpConversationToDb } from "../../mappers";
import { getChatStore, useChatStore } from "../../store/accountsStore";
import { XmtpConversation } from "../../store/chatStore";

export const cleanupPendingConversations = async (account: string) => {
  const conversationRepository = await getRepository(account, "conversation");
  const pendingConversations = await conversationRepository.find({
    where: { pending: true },
    relations: { messages: true },
  });
  const pendingConversationsWithoutMessages = pendingConversations.filter(
    (c) => c.pending && c.messages?.length === 0
  );
  if (pendingConversationsWithoutMessages.length === 0) return;
  logger.debug(
    `Cleaning up ${pendingConversationsWithoutMessages.length} pending convos`
  );
  const topicsToDelete = pendingConversationsWithoutMessages.map(
    (c) => c.topic
  );
  await conversationRepository.delete({
    topic: In(topicsToDelete),
  });
  useChatStore.getState().deleteConversations(topicsToDelete);
};

const getPendingConversationWithPeer = async (
  account: string,
  address: string,
  conversationId?: string
) => {
  const conversationRepository = await getRepository(account, "conversation");

  const pendingConversationsWithPeer = await conversationRepository.find({
    where: { peerAddress: address, pending: true },
  });
  const conversation = pendingConversationsWithPeer.find((c) =>
    conversationId
      ? c.contextConversationId === conversationId
      : !c.contextConversationId
  );

  return conversation;
};

export const createPendingConversation = async (
  account: string,
  peerAddress: string,
  context?: InvitationContext
) => {
  if (account.toLowerCase() === peerAddress.toLowerCase()) {
    // Can't create self convo!
    Alert.alert("You can't create a conversation with yourself!");
    return undefined;
  }
  const cleanAddress = getCleanAddress(peerAddress);
  // Let's first check if we already have a conversation like that in db
  const alreadyConversationInDb = await getPendingConversationWithPeer(
    account,
    cleanAddress,
    context?.conversationId
  );
  if (alreadyConversationInDb)
    throw new Error(
      `A conversation with ${cleanAddress} and id ${context?.conversationId} already exists`
    );

  const pendingConversationId = uuidv4();
  await saveConversations(account, [
    {
      topic: pendingConversationId,
      pending: true,
      peerAddress: cleanAddress,
      createdAt: new Date().getTime(),
      messages: new Map(),
      messagesIds: [],
      readUntil: 0,
      context,
      version: "v2",
      isGroup: false,
    },
  ]);
  return pendingConversationId;
};

export const upgradePendingConversationsIfNeeded = async (
  account: string,
  conversations: XmtpConversation[]
) => {
  const conversationRepository = await getRepository(account, "conversation");
  const messageRepository = await getRepository(account, "message");

  const peerAddresses = conversations.map((c) => c.peerAddress);
  let pendingConversationsWithPeers: Conversation[] = [];
  if (Platform.OS === "web") {
    // On web, we don't have a database to query, we'll go over the local store
    pendingConversationsWithPeers = Object.values(
      getChatStore(account).getState().conversations
    )
      .filter((c) => c.pending && peerAddresses.includes(c.peerAddress))
      .map(xmtpConversationToDb);
  } else {
    pendingConversationsWithPeers = await conversationRepository.find({
      where: { pending: true, peerAddress: In(peerAddresses) },
    });
  }

  // If we get back a conversation from XMTP that corresponds
  // to a conversation that we have locally pending, we need
  // to delete the pending one and reassigns messages

  for (const conversation of conversations) {
    const alreadyConversationInDbWithConversationId =
      pendingConversationsWithPeers.find((c) =>
        c.peerAddress === conversation.peerAddress &&
        conversation.context?.conversationId
          ? c.contextConversationId === conversation.context?.conversationId
          : !c.contextConversationId
      );

    if (
      !alreadyConversationInDbWithConversationId ||
      alreadyConversationInDbWithConversationId.topic === conversation.topic
    ) {
      continue;
    }

    // Save this one to db
    await upsertRepository(
      conversationRepository,
      [xmtpConversationToDb(conversation)],
      ["topic"]
    );

    // Reassign messages
    await messageRepository.update(
      { conversationId: alreadyConversationInDbWithConversationId.topic },
      { conversationId: conversation.topic }
    );

    // Deleting the old conversation
    await conversationRepository.delete({
      topic: alreadyConversationInDbWithConversationId.topic,
    });

    // Dispatch
    getChatStore(account)
      .getState()
      .updateConversationTopic(
        alreadyConversationInDbWithConversationId.topic,
        conversation
      );
  }
};

export const getPendingConversationsToCreate = async (account: string) => {
  const conversationRepository = await getRepository(account, "conversation");
  const pendingConversations = await conversationRepository.find({
    where: {
      pending: true,
    },
    relations: { messages: true },
  });
  return pendingConversations.filter(
    (c) => c.messages && c.messages.length > 0
  );
};
