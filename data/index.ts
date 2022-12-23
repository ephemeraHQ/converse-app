import "reflect-metadata";
import { getLensHandle } from "../utils/alchemy";
import { conversationRepository, messageRepository } from "./db";
import { Conversation } from "./db/entities/conversation";
import { Message } from "./db/entities/message";
import { ActionsType } from "./store/context";
import {
  XmtpConversation,
  XmtpDispatchTypes,
  XmtpMessage,
} from "./store/xmtpReducer";

type DispatchType = (value: ActionsType) => void;
type MaybeDispatchType = DispatchType | undefined;

const xmtpMessageToDb = (
  xmtpMessage: XmtpMessage,
  conversationTopic: string
): Message => ({
  id: xmtpMessage.id,
  senderAddress: xmtpMessage.senderAddress,
  sent: xmtpMessage.sent,
  content: xmtpMessage.content,
  conversationId: conversationTopic,
});

const xmtpMessageFromDb = (message: Message): XmtpMessage => ({
  id: message.id,
  senderAddress: message.senderAddress,
  sent: message.sent,
  content: message.content,
});

const xmtpConversationToDb = (
  xmtpConversation: XmtpConversation
): Conversation => ({
  topic: xmtpConversation.topic,
  peerAddress: xmtpConversation.peerAddress,
  createdAt: xmtpConversation.createdAt,
  contextConversationId: xmtpConversation.context?.conversationId,
  contextMetadata: xmtpConversation.context?.metadata
    ? JSON.stringify(xmtpConversation.context.metadata)
    : undefined,
  lensHandle: xmtpConversation.lensHandle,
});

const xmtpConversationFromDb = (
  dbConversation: Conversation
): XmtpConversation => {
  let context = undefined;
  if (dbConversation.contextConversationId) {
    context = {
      conversationId: dbConversation.contextConversationId,
      metadata: dbConversation.contextMetadata
        ? JSON.parse(dbConversation?.contextMetadata)
        : undefined,
    };
  }
  return {
    topic: dbConversation.topic,
    peerAddress: dbConversation.peerAddress,
    createdAt: dbConversation.createdAt,
    context,
    messages: dbConversation.messages
      ? dbConversation.messages.map(xmtpMessageFromDb)
      : [],
    lensHandle: dbConversation.lensHandle,
  };
};

const addLensHandle = async (conversation: XmtpConversation) => {
  try {
    const lensHandle = await getLensHandle(conversation.peerAddress);
    conversation.lensHandle = lensHandle;
  } catch (e: any) {
    // Error (probably rate limited by Alchemy)
    console.log("Could not add lens handle:", conversation.peerAddress, e);
    // Let's check if already exists in DB
    const alreadyConversationInDb = await conversationRepository.findOne({
      where: { topic: conversation.topic },
    });
    if (alreadyConversationInDb) {
      conversation.lensHandle = alreadyConversationInDb.lensHandle;
    }
  }
};

export const saveConversations = async (
  conversations: XmtpConversation[],
  dispatch: MaybeDispatchType
) => {
  await Promise.all(conversations.map(addLensHandle));
  // First save to db
  conversationRepository.upsert(conversations.map(xmtpConversationToDb), [
    "topic",
  ]);
  // Then dispatch if set
  if (!dispatch) return;
  dispatch({
    type: XmtpDispatchTypes.XmtpSetConversations,
    payload: {
      conversations,
    },
  });
};

export const saveNewConversation = async (
  conversation: XmtpConversation,
  dispatch: MaybeDispatchType
) => {
  await addLensHandle(conversation);
  // First save to db
  conversationRepository.upsert(
    [xmtpConversationToDb(conversation)],
    ["topic"]
  );
  // Then dispatch if set
  if (!dispatch) return;
  dispatch({
    type: XmtpDispatchTypes.XmtpNewConversation,
    payload: {
      conversation,
    },
  });
};

export const saveMessages = async (
  messages: XmtpMessage[],
  conversationTopic: string,
  dispatch: MaybeDispatchType
) => {
  // First save to db
  messageRepository.upsert(
    messages.map((xmtpMessage) =>
      xmtpMessageToDb(xmtpMessage, conversationTopic)
    ),
    ["id"]
  );
  // Then dispatch if set
  if (!dispatch) return;
  dispatch({
    type: XmtpDispatchTypes.XmtpSetMessages,
    payload: {
      topic: conversationTopic,
      messages,
    },
  });
};

export const loadDataToContext = async (dispatch: DispatchType) => {
  // Let's load conversations and messages and save to context

  const conversationsWithMessages = await conversationRepository.find({
    relations: { messages: true },
    order: { messages: { sent: "DESC" } },
  });

  dispatch({
    type: XmtpDispatchTypes.XmtpSetConversations,
    payload: {
      conversations: conversationsWithMessages.map((c) =>
        xmtpConversationFromDb(c)
      ),
    },
  });
};
