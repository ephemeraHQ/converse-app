import "reflect-metadata";

import { addLog } from "../components/DebugButton";
import { ethProvider } from "../utils/eth";
import { getLensHandleFromConversationId } from "../utils/lens";
import {
  saveConversationDict,
  saveXmtpEnv,
  saveApiURI,
} from "../utils/sharedData/sharedData";
import { shortAddress } from "../utils/str";
import { conversationRepository, messageRepository } from "./db";
import { Conversation } from "./db/entities/conversation";
import { Message } from "./db/entities/message";
import { upsertRepository } from "./db/upsert";
import { DispatchType } from "./store/context";
import {
  XmtpConversation,
  XmtpDispatchTypes,
  XmtpMessage,
} from "./store/xmtpReducer";

type MaybeDispatchType = DispatchType | undefined;

const xmtpMessageToDb = (
  xmtpMessage: XmtpMessage,
  conversationTopic: string
): Message => ({
  id: xmtpMessage.id,
  senderAddress: xmtpMessage.senderAddress,
  sent: xmtpMessage.sent,
  content: xmtpMessage.content || "",
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

const saveConversationIdentifiersForNotifications = (
  conversation: XmtpConversation
) => {
  const conversationDict: any = {
    peerAddress: conversation.peerAddress,
    shortAddress: shortAddress(conversation.peerAddress),
  };

  if (conversation.lensHandle) {
    conversationDict.lensHandle = conversation.lensHandle;
  }

  if (conversation.ensName) {
    conversationDict.ensName = conversation.ensName;
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

type HandlesToResolve = {
  conversation: XmtpConversation;
  shouldResolveHandles: boolean;
};

const setupAndSaveConversation = async (
  conversation: XmtpConversation
): Promise<HandlesToResolve> => {
  const alreadyConversationInDb = await conversationRepository.findOne({
    where: { topic: conversation.topic },
  });

  const lastHandlesResolution = alreadyConversationInDb?.handlesUpdatedAt || 0;
  const now = new Date().getTime();
  const shouldResolveHandles = now - lastHandlesResolution >= 24 * 3600 * 1000;

  const lensHandle = alreadyConversationInDb?.lensHandle || null;
  const ensName = alreadyConversationInDb?.ensName || null;

  conversation.lensHandle = lensHandle;
  conversation.ensName = ensName;

  // Save to db
  await upsertRepository(
    conversationRepository,
    [xmtpConversationToDb(conversation)],
    ["topic"]
  );

  saveConversationIdentifiersForNotifications(conversation);

  return {
    conversation,
    shouldResolveHandles,
  };
};

const resolveHandlesForConversation = async (
  conversation: XmtpConversation
) => {
  const currentLensHandle = conversation.lensHandle;
  const currentEnsName = conversation.ensName;
  let updated = false;
  try {
    const newLensHandle = await getLensHandleFromConversationId(
      conversation.context?.conversationId,
      conversation.peerAddress
    );
    const newEnsName = await ethProvider.lookupAddress(
      conversation.peerAddress
    );
    if (newLensHandle !== currentLensHandle || newEnsName !== currentEnsName) {
      updated = true;
    }
    conversation.lensHandle = newLensHandle;
    conversation.ensName = newEnsName;
  } catch (e) {
    // Error (probably rate limited)
    console.log("Could not resolve handles:", conversation.peerAddress, e);
  }

  // Save to db
  await upsertRepository(
    conversationRepository,
    [
      {
        ...xmtpConversationToDb(conversation),
        handlesUpdatedAt: new Date().getTime(),
      },
    ],
    ["topic"]
  );
  saveConversationIdentifiersForNotifications(conversation);
  return { conversation, updated };
};

export const saveConversations = async (
  conversations: XmtpConversation[],
  dispatch: MaybeDispatchType
) => {
  // Save immediatly to db
  const saveResult = await Promise.all(
    conversations.map(setupAndSaveConversation)
  );
  // Then to context
  if (dispatch) {
    dispatch({
      type: XmtpDispatchTypes.XmtpSetConversations,
      payload: {
        conversations: saveResult.map((r) => r.conversation),
      },
    });
  }
  // Now let's see what conversations need to have a handle resolved
  const conversationsToResolve = saveResult
    .filter((c) => c.shouldResolveHandles)
    .map((c) => c.conversation);
  if (conversationsToResolve.length === 0) return;
  const resolveResult = await Promise.all(
    conversationsToResolve.map(resolveHandlesForConversation)
  );
  const conversationsResolved = resolveResult
    .filter((r) => r.updated)
    .map((r) => r.conversation);
  if (dispatch && conversationsResolved.length > 0) {
    dispatch({
      type: XmtpDispatchTypes.XmtpSetConversations,
      payload: {
        conversations: conversationsResolved,
      },
    });
  }
};

export const saveNewConversation = async (
  conversation: XmtpConversation,
  dispatch: MaybeDispatchType
) => {
  // Save immediatly to db
  const saveResult = await setupAndSaveConversation(conversation);
  // Then to context
  if (dispatch) {
    dispatch({
      type: XmtpDispatchTypes.XmtpNewConversation,
      payload: {
        conversation,
      },
    });
  }
  // Now let's see if conversation needs to have a handle resolved
  if (saveResult.shouldResolveHandles) {
    const resolveResult = await resolveHandlesForConversation(
      saveResult.conversation
    );
    if (dispatch && resolveResult.updated) {
      dispatch({
        type: XmtpDispatchTypes.XmtpSetConversations,
        payload: {
          conversations: [resolveResult.conversation],
        },
      });
    }
  }
};

export const saveMessages = async (
  messages: XmtpMessage[],
  conversationTopic: string,
  dispatch: MaybeDispatchType
) => {
  // First save to db
  upsertRepository(
    messageRepository,
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
  saveApiURI();
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
