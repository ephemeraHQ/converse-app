import "reflect-metadata";

import { Reaction } from "@xmtp/content-type-reaction";
import RNFS from "react-native-fs";

import { addLog } from "../components/DebugButton";
import { getProfilesForAddresses } from "../utils/api";
import { getLensHandleFromConversationIdAndPeer } from "../utils/lens";
import { lastValueInMap } from "../utils/map";
import { sentryTrackMessage } from "../utils/sentry";
import {
  saveConversationDict,
  saveXmtpEnv,
  saveApiURI,
} from "../utils/sharedData/sharedData";
import { conversationName, shortAddress } from "../utils/str";
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
  contentType: xmtpMessage.contentType,
  contentFallback: xmtpMessage.contentFallback,
  // we don't include the reactions field as it is
  // filled by other methods
});

const xmtpMessageFromDb = (message: Message): XmtpMessage => ({
  id: message.id,
  senderAddress: message.senderAddress,
  sent: message.sent,
  content: message.content,
  status: message.status,
  sentViaConverse: !!message.sentViaConverse,
  contentType: message.contentType,
  contentFallback: message.contentFallback,
  reactions: message.reactions || "{}",
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
  const unsDomain = socials?.unstoppableDomains?.find(
    (d) => d.isPrimary
  )?.domain;
  const conversationTitle = lensHandle || ensName || unsDomain;

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
    conversationTitle,
    readUntil: dbConversation.readUntil || 0,
  };
};

const saveConversationIdentifiersForNotifications = (
  conversation: XmtpConversation
) => {
  const conversationDict: any = {
    peerAddress: conversation.peerAddress,
    shortAddress: shortAddress(conversation.peerAddress),
    title: conversationName(conversation),
  };

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
  const unsDomain =
    profileSocials?.unstoppableDomains?.find((e) => e.isPrimary)?.domain ||
    null;

  // If this is a lens convo we show lens, if not ENS
  conversation.conversationTitle = lensHandle || ensName || unsDomain;
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
  conversations: XmtpConversation[],
  dispatch: MaybeDispatchType
) => {
  const updates: ConversationHandlesUpdate[] = [];
  let batch: XmtpConversation[] = [];
  let rest = conversations;

  while (rest.length > 0) {
    batch = rest.slice(0, 150);
    rest = rest.slice(150);
    const addressesSet = new Set<string>();
    batch.forEach((c) => addressesSet.add(c.peerAddress));
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
    // Dispatching the profile to state
    const socialsToDispatch: {
      [address: string]: { socials: ProfileSocials };
    } = {};
    for (const address in profilesByAddress) {
      socialsToDispatch[address] = { socials: profilesByAddress[address] };
    }
    if (dispatch) {
      dispatch({
        type: ProfilesDispatchTypes.SetProfiles,
        payload: { profiles: socialsToDispatch },
      });
    }

    console.log("Done saving profiles to db!");
    const handleConversation = async (conversation: XmtpConversation) => {
      const currentTitle = conversation.conversationTitle;
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
        const newUnsDomain = profilesByAddress[
          conversation.peerAddress
        ].unstoppableDomains?.find((e) => e.isPrimary)?.domain;
        const newTitle = newLensHandle || newEnsName || newUnsDomain;
        if (newTitle !== currentTitle) {
          updated = true;
        }
        conversation.conversationTitle = newTitle;
      } catch (e) {
        // Error (probably rate limited)
        console.log("Could not resolve handles:", conversation.peerAddress, e);
      }

      updates.push({ conversation, updated });
      saveConversationIdentifiersForNotifications(conversation);
    };

    await Promise.all(batch.map(handleConversation));
  }

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
  const resolveResult = await updateProfilesForConversations(
    convosToUpdate,
    dispatch
  );

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
      await updateProfilesForConversations([saveResult.conversation], dispatch)
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
  // First save all messages to db
  const upsertPromise = upsertRepository(
    messageRepository,
    messages.map((xmtpMessage) =>
      xmtpMessageToDb(xmtpMessage, conversationTopic)
    ),
    ["id"]
  );

  // Then dispatch if set
  if (dispatch) {
    dispatch({
      type: XmtpDispatchTypes.XmtpSetMessages,
      payload: {
        topic: conversationTopic,
        messages,
      },
    });
  }

  const reactionMessages = messages.filter((m) =>
    m.contentType.startsWith("xmtp.org/reaction:")
  );

  // Now we can handle reactions if there are any
  if (reactionMessages.length > 0) {
    await upsertPromise;
    await saveReactions(reactionMessages, conversationTopic, dispatch);
  }
};

const saveReactions = async (
  reactionMessages: XmtpMessage[],
  conversationTopic: string,
  dispatch: MaybeDispatchType
) => {
  for (const reactionMessage of reactionMessages) {
    try {
      const reactionContent = JSON.parse(reactionMessage.content) as Reaction;
      // Check if message exists
      const message = await messageRepository.findOneBy({
        id: reactionContent.reference,
        conversationId: conversationTopic,
      });
      if (message) {
        const reactions = JSON.parse(message.reactions || "{}");
        reactions[reactionMessage.id] = {
          action: reactionContent.action,
          schema: reactionContent.schema,
          content: reactionContent.content,
          senderAddress: reactionMessage.senderAddress,
          sent: reactionMessage.sent,
        };
        message.reactions = JSON.stringify(reactions);
        await messageRepository.save(message);
        if (dispatch) {
          dispatch({
            type: XmtpDispatchTypes.XmtpSetMessages,
            payload: {
              topic: conversationTopic,
              messages: [xmtpMessageFromDb(message)],
            },
          });
        }
      }
    } catch (e) {
      sentryTrackMessage("CANT_PARSE_REACTION_CONTENT", {
        reactionMessageContent: reactionMessage.content,
      });
    }
  }
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
    // Let's also move message data & attachments if exists
    const oldMessageFolder = `${RNFS.DocumentDirectoryPath}/messages/${messageToUpdate.message.id}`;
    const newMessageFolder = `${RNFS.DocumentDirectoryPath}/messages/${messageToUpdate.newMessageId}`;
    const [messageFolderExists, updatedMessage] = await Promise.all([
      RNFS.exists(oldMessageFolder),
      messageRepository.findOneBy({
        id: messageToUpdate.newMessageId,
      }),
    ]);
    if (messageFolderExists) {
      await RNFS.moveFile(oldMessageFolder, newMessageFolder);
    }
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

export const refreshProfileForAddress = async (
  address: string,
  dispatch: DispatchType
) => {
  const now = new Date().getTime();
  const profilesByAddress = await getProfilesForAddresses([address]);
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
  dispatch({
    type: ProfilesDispatchTypes.SetProfiles,
    payload: {
      profiles: {
        [address]: {
          socials: profilesByAddress[address],
        },
      },
    },
  });
};
