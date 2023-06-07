import "reflect-metadata";

import { addLog } from "../components/DebugButton";
import { getProfilesForAddresses } from "../utils/api";
import { getLensHandleFromConversationIdAndPeer } from "../utils/lens";
import { lastValueInMap } from "../utils/map";
import {
  saveConversationDict,
  saveXmtpEnv,
  saveApiURI,
} from "../utils/sharedData/sharedData";
import { shortAddress } from "../utils/str";
import {
  conversationRepository,
  messageRepository,
  profileRepository,
} from "./db";
import dataSource from "./db/datasource";
import { Conversation } from "./db/entities/conversation";
import { Message } from "./db/entities/message";
import { Profile, ProfileSocials } from "./db/entities/profile";
import { upsertRepository } from "./db/upsert";
import { DispatchType } from "./store/context";
import { ProfilesDispatchTypes } from "./store/profilesReducer";
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
  status: xmtpMessage.status || "sent",
  sentViaConverse: !!xmtpMessage.sentViaConverse,
});

const xmtpMessageFromDb = (message: Message): XmtpMessage => ({
  id: message.id,
  senderAddress: message.senderAddress,
  sent: message.sent,
  content: message.content,
  status: message.status,
  sentViaConverse: !!message.sentViaConverse,
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
  readUntil: xmtpConversation.readUntil || 0,
});

const xmtpConversationFromDb = (
  dbConversation: Conversation,
  socials?: ProfileSocials
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

  const lensHandle = getLensHandleFromConversationIdAndPeer(
    dbConversation.contextConversationId,
    socials?.lensHandles
  );
  const ensName = socials?.ensNames?.find((e) => e.isPrimary)?.name;

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
    lensHandle,
    ensName,
    readUntil: dbConversation.readUntil || 0,
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
  shouldUpdateProfile: boolean;
};

const setupAndSaveConversation = async (
  conversation: XmtpConversation
): Promise<HandlesToResolve> => {
  const alreadyConversationInDb = await conversationRepository.findOne({
    where: { topic: conversation.topic },
  });

  let alreadyProfileInDb: Profile | null = null;
  if (alreadyConversationInDb) {
    alreadyProfileInDb = await profileRepository.findOne({
      where: { address: alreadyConversationInDb.peerAddress },
    });
  }
  const lastProfileUpdate = alreadyProfileInDb?.updatedAt || 0;
  const now = new Date().getTime();
  const shouldUpdateProfile = now - lastProfileUpdate >= 24 * 3600 * 1000;

  const profileSocials = alreadyProfileInDb?.getSocials();

  const lensHandle = getLensHandleFromConversationIdAndPeer(
    conversation.context?.conversationId,
    profileSocials?.lensHandles
  );
  const ensName =
    profileSocials?.ensNames?.find((e) => e.isPrimary)?.name || null;

  conversation.lensHandle = lensHandle;
  conversation.ensName = ensName;
  conversation.readUntil =
    conversation.readUntil || alreadyConversationInDb?.readUntil || 0;

  // Save to db
  await upsertRepository(
    conversationRepository,
    [xmtpConversationToDb(conversation)],
    ["topic"]
  );

  saveConversationIdentifiersForNotifications(conversation);

  return {
    conversation,
    shouldUpdateProfile,
  };
};

type ConversationHandlesUpdate = {
  conversation: XmtpConversation;
  updated: boolean;
};

const updateProfilesForConversations = async (
  conversations: XmtpConversation[]
) => {
  const addressesSet = new Set<string>();
  conversations.forEach((c) => addressesSet.add(c.peerAddress));
  console.log(`Fetching ${addressesSet.size} profiles from API...`);
  const profilesByAddress = await getProfilesForAddresses(
    Array.from(addressesSet)
  );
  const now = new Date().getTime();
  console.log("Saving profiles to db...");
  // Save profiles to db
  await upsertRepository(
    profileRepository,
    Object.keys(profilesByAddress).map((address) => ({
      socials: JSON.stringify(profilesByAddress[address]),
      updatedAt: now,
      address,
    })),
    ["address"]
  );
  console.log("Done saving profiles to db!");
  const updates: ConversationHandlesUpdate[] = [];
  const handleConversation = async (conversation: XmtpConversation) => {
    const currentLensHandle = conversation.lensHandle;
    const currentEnsName = conversation.ensName;
    let updated = false;
    try {
      const profileForConversation =
        profilesByAddress[conversation.peerAddress];
      let newLensHandle: string | null | undefined = null;
      if (profileForConversation) {
        newLensHandle = getLensHandleFromConversationIdAndPeer(
          conversation.context?.conversationId,
          profileForConversation.lensHandles
        );
      }
      const newEnsName = profilesByAddress[
        conversation.peerAddress
      ].ensNames?.find((e) => e.isPrimary)?.name;
      if (
        newLensHandle !== currentLensHandle ||
        newEnsName !== currentEnsName
      ) {
        updated = true;
      }
      conversation.lensHandle = newLensHandle;
      conversation.ensName = newEnsName;
    } catch (e) {
      // Error (probably rate limited)
      console.log("Could not resolve handles:", conversation.peerAddress, e);
    }

    updates.push({ conversation, updated });
    saveConversationIdentifiersForNotifications(conversation);
  };

  await Promise.all(conversations.map(handleConversation));

  return updates;
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
  // Now let's see what profiles need to be updated
  const convosToUpdate = saveResult
    .filter((c) => c.shouldUpdateProfile)
    .map((c) => c.conversation);
  if (convosToUpdate.length === 0) return;
  const resolveResult = await updateProfilesForConversations(convosToUpdate);

  const updatedConversations = resolveResult
    .filter((r) => r.updated)
    .map((r) => r.conversation);
  if (dispatch && updatedConversations.length > 0) {
    dispatch({
      type: XmtpDispatchTypes.XmtpSetConversations,
      payload: {
        conversations: updatedConversations,
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
  if (saveResult.shouldUpdateProfile) {
    const resolveResult = (
      await updateProfilesForConversations([saveResult.conversation])
    )[0];
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

export const loadProfilesByAddress = async () => {
  const profiles = await profileRepository.find();
  const profileByAddress: { [address: string]: { socials: ProfileSocials } } =
    {};
  profiles.forEach(
    (p) => (profileByAddress[p.address] = { socials: p.getSocials() })
  );
  return profileByAddress;
};

export const loadProfileByAddress = async (address: string) =>
  profileRepository.findOne({ where: { address } });

export const loadDataToContext = async (dispatch: DispatchType) => {
  // Save env to shared data with extension
  saveXmtpEnv();
  saveApiURI();
  // Let's load conversations and messages and save to context
  const [conversationsWithMessages, profilesByAddress] = await Promise.all([
    conversationRepository.find({
      relations: { messages: true },
      order: { messages: { sent: "ASC" } },
    }),
    loadProfilesByAddress(),
  ]);
  dispatch({
    type: ProfilesDispatchTypes.SetProfiles,
    payload: { profiles: profilesByAddress },
  });
  dispatch({
    type: XmtpDispatchTypes.XmtpSetConversations,
    payload: {
      conversations: conversationsWithMessages.map((c) =>
        xmtpConversationFromDb(c, profilesByAddress[c.peerAddress]?.socials)
      ),
    },
  });
};

export const getMessagesToSend = async () => {
  const messagesToSend = await messageRepository.find({
    where: {
      status: "sending",
    },
    order: {
      sent: "ASC",
    },
  });
  return messagesToSend;
};

export const updateMessagesIds = async (
  messageIdsToUpdate: {
    [messageId: string]: {
      newMessageId: string;
      newMessageSent: number;
      message: Message;
    };
  },
  dispatch: DispatchType
) => {
  const messagesToDispatch: {
    topic: string;
    message: XmtpMessage;
    oldId: string;
  }[] = [];
  for (const oldId in messageIdsToUpdate) {
    const messageToUpdate = messageIdsToUpdate[oldId];
    await messageRepository.update(
      { id: messageToUpdate.message.id },
      { id: messageToUpdate.newMessageId, sent: messageToUpdate.newMessageSent }
    );
    const updatedMessage = await messageRepository.findOneBy({
      id: messageToUpdate.newMessageId,
    });
    if (!updatedMessage) throw new Error("Updated message does not exist");
    messagesToDispatch.push({
      topic: messageToUpdate.message.conversationId,
      message: xmtpMessageFromDb(updatedMessage),
      oldId,
    });
  }
  dispatch({
    type: XmtpDispatchTypes.XmtpUpdateMessageIds,
    payload: messagesToDispatch,
  });
};

export const markMessageAsSent = async (
  messageId: string,
  topic: string,
  dispatch: DispatchType
) => {
  await messageRepository.update({ id: messageId }, { status: "sent" });
  dispatch({
    type: XmtpDispatchTypes.XmtpUpdateMessageStatus,
    payload: {
      messageId,
      topic,
      status: "sent",
    },
  });
};

export const markAllConversationsAsReadInDb = async () => {
  await dataSource.query(
    `UPDATE "conversation" SET "readUntil" = (SELECT COALESCE(MAX(sent), 0) FROM "message" WHERE "message"."conversationId" = "conversation"."topic")`
  );
};

export const markConversationReadUntil = (
  conversation: XmtpConversation,
  readUntil: number,
  dispatch: DispatchType,
  allowBefore = false
) => {
  if (readUntil === conversation.readUntil) {
    return;
  }
  if (readUntil < conversation.readUntil && !allowBefore) {
    return;
  }
  return saveConversations([{ ...conversation, readUntil }], dispatch);
};

export const markConversationRead = (
  conversation: XmtpConversation,
  dispatch: DispatchType,
  allowBefore = false
) => {
  let newReadUntil = conversation.readUntil;
  if (conversation.messages.size > 0) {
    const lastMessage = lastValueInMap(conversation.messages);
    if (lastMessage) {
      newReadUntil = lastMessage.sent;
    }
  }
  return markConversationReadUntil(
    conversation,
    newReadUntil,
    dispatch,
    allowBefore
  );
};
