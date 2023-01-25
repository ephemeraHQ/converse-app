import "reflect-metadata";

import uuid from "react-native-uuid";

import { addLog } from "../components/DebugButton";
import { resolveENSAddress } from "../utils/ens";
import { getLensHandle } from "../utils/lens";
import {
  emptySavedNotificationsMessages,
  loadSavedNotificationsMessages,
  saveConversationDict,
  saveXmtpEnv,
} from "../utils/sharedData";
import { shortAddress } from "../utils/str";
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
  ensName: xmtpConversation.ensName,
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
      ? new Map(
          dbConversation.messages.map((m) => [m.id, xmtpMessageFromDb(m)])
        )
      : new Map(),
    lensHandle: dbConversation.lensHandle,
    ensName: dbConversation.ensName,
    lazyMessages: [],
  };
};

const setupAndSaveConversation = async (conversation: XmtpConversation) => {
  const alreadyConversationInDb = await conversationRepository.findOne({
    where: { topic: conversation.topic },
  });

  const lastHandlesResolution = alreadyConversationInDb?.handlesUpdatedAt || 0;
  const now = new Date().getTime();
  const shouldResolveHandles = now - lastHandlesResolution >= 24 * 3600 * 1000;

  let lensHandle = alreadyConversationInDb?.lensHandle;
  let ensName = alreadyConversationInDb?.ensName;

  if (shouldResolveHandles) {
    try {
      lensHandle = await getLensHandle(conversation.peerAddress);
      ensName = await resolveENSAddress(conversation.peerAddress);
    } catch (e) {
      // Error (probably rate limited)
      console.log("Could not resolve handles:", conversation.peerAddress, e);
    }
  }

  conversation.lensHandle = lensHandle;
  conversation.ensName = ensName;

  // Save to db
  await conversationRepository.upsert(
    [{ ...xmtpConversationToDb(conversation), handlesUpdatedAt: now }],
    ["topic"]
  );

  const conversationDict: any = {
    peerAddress: conversation.peerAddress,
    shortAddress: shortAddress(conversation.peerAddress),
  };

  if (lensHandle) {
    conversationDict.lensHandle = lensHandle;
  }

  if (ensName) {
    conversationDict.ensName = ensName;
  }

  // Also save to shared preferences to be able to show notification
  saveConversationDict(conversation.topic, conversationDict).catch((e) => {
    const dataToSave = {
      topic: `conversation-${conversation.topic}`,
      conversationDict,
    };
    addLog(
      `ERROR_SAVING_SHARED_PREFERENCE: ${e} - ${JSON.stringify(dataToSave)}`
    );
  });
};

export const saveConversations = async (
  conversations: XmtpConversation[],
  dispatch: MaybeDispatchType
) => {
  await Promise.all(conversations.map(setupAndSaveConversation));
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
  await setupAndSaveConversation(conversation);
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
  // Save env to shared data with extension
  saveXmtpEnv();
  // Let's load conversations and messages and save to context
  const conversationsWithMessages = await conversationRepository.find({
    relations: { messages: true },
    order: { messages: { sent: "ASC" } },
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

export const loadSavedNotificationMessagesToContext = async (
  dispatch: DispatchType
) => {
  const messages = await loadSavedNotificationsMessages();
  console.log("found", messages);
  emptySavedNotificationsMessages();
  messages.sort((m1: any, m2: any) => m1.sent - m2.sent);
  messages.forEach((message: any) => {
    dispatch({
      type: XmtpDispatchTypes.XmtpLazyMessage,
      payload: {
        topic: message.topic,
        message: {
          id: uuid.v4().toString(),
          senderAddress: message.senderAddress,
          sent: message.sent,
          content: message.content,
        },
      },
    });
  });
};
