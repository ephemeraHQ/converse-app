import logger from "@utils/logger";
import { RemoteAttachmentContent } from "@xmtp/react-native-sdk";
import isDeepEqual from "fast-deep-equal";
import { Platform } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  TopicSpamScores,
  computeConversationsSpamScores,
} from "../../data/helpers/conversations/spamScore";
import { saveTopicsData } from "../../utils/api";
import {
  ConversationWithLastMessagePreview,
  getTopicsUpdatesAsRead,
  markConversationsAsReadIfNecessary,
} from "../../utils/conversation";
import { zustandMMKVStorage } from "../../utils/mmkv";
import { subscribeToNotifications } from "../../utils/notifications";
import { omit } from "../../utils/objects";
import { refreshBalanceForAccount } from "../../utils/wallet";
import { isContentType } from "../../utils/xmtpRN/contentTypes";
import { ConverseMessageMetadata } from "../db/entities/messageEntity";

// Chat data for each user

type XmtpConversationContext = {
  conversationId: string;
  metadata: {
    [k: string]: string;
  };
};

type XmtpConversationShared = {
  topic: string;
  createdAt: number;
  context?: XmtpConversationContext;
  messages: Map<string, XmtpMessage>;
  messagesIds: string[];
  conversationTitle?: string | null;
  messageDraft?: string;
  mediaPreview?: MediaPreview;
  readUntil: number; // UNUSED
  hasOneMessageFromMe?: boolean;
  pending: boolean;
  version: string;
  spamScore?: number;
  lastNotificationsSubscribedPeriod?: number;
};

export type XmtpDMConversation = XmtpConversationShared & {
  isGroup: false;
  peerAddress: string;
  groupMembers?: undefined;
  groupAdmins?: undefined;
  groupPermissionLevel?: undefined;
};

export type XmtpGroupConversation = XmtpConversationShared & {
  isGroup: true;
  peerAddress?: undefined;
  groupMembers: string[];
  groupPermissionLevel: "all_members" | "admin_only" | "custom_policy";
  groupName?: string;
  groupCreator?: string;
  groupAddedBy?: string;
  isActive?: boolean;
};

export type XmtpConversation = XmtpDMConversation | XmtpGroupConversation;

export type XmtpConversationWithUpdate = XmtpConversation & {
  lastUpdateAt: number;
};

type XmtpProtocolMessage = {
  id: string;
  senderAddress: string;
  sent: number;
  content: string;
  contentType: string;
  topic: string;
};

export type XmtpMessage = XmtpProtocolMessage & {
  status: "delivered" | "error" | "seen" | "sending" | "sent" | "prepared";
  reactions?: Map<string, XmtpMessage>;
  contentFallback?: string;
  referencedMessageId?: string;
  lastUpdateAt?: number;
  converseMetadata?: ConverseMessageMetadata;
  localMediaURI?: string;
};

type ConversationsListItems = {
  conversationsInbox: ConversationWithLastMessagePreview[];
  conversationsRequests: ConversationWithLastMessagePreview[];
  conversationsBlocked: ConversationWithLastMessagePreview[];
};

export type TopicData = {
  status: "deleted" | "unread" | "read";
  readUntil?: number;
  timestamp?: number;
};

export type TopicsData = {
  [topic: string]: TopicData | undefined;
};

export type MediaPreview = {
  mediaURI: string;
  status: "picked" | "uploading" | "uploaded" | "error" | "sending";
  uploadedAttachment?: RemoteAttachmentContent | null;
  attachmentToSave?: {
    filePath: string;
    mimeType: string | null;
    fileName: string;
  };
} | null;

export type Attachment = {
  loading: boolean;
  error: boolean;
  mediaType: "IMAGE" | "UNSUPPORTED" | undefined;
  mediaURL: string | undefined;
  filename: string;
  mimeType: string;
  contentLength: number;
  imageSize: { height: number; width: number } | undefined;
};

export type ChatStoreType = {
  conversations: {
    [topic: string]: XmtpConversationWithUpdate;
  };
  pinnedConversations: XmtpConversation[];
  openedConversationTopic: string | null;
  setOpenedConversationTopic: (topic: string | null) => void;
  conversationsMapping: {
    [oldTopic: string]: string;
  };
  lastUpdateAt: number;
  lastSyncedAt: number;
  lastSyncedTopics: string[];
  initialLoadDone: boolean;
  initialLoadDoneOnce: boolean;
  localClientConnected: boolean;
  resyncing: boolean;
  reconnecting: boolean;
  errored: boolean;
  topicsData: TopicsData;
  topicsDataFetchedOnce: boolean | undefined;

  conversationsSortedOnce: boolean;
  sortedConversationsWithPreview: ConversationsListItems;
  setSortedConversationsWithPreview: (items: ConversationsListItems) => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchBarFocused: boolean;
  setSearchBarFocused: (focused: boolean) => void;

  setConversations: (conversations: XmtpConversation[]) => void;
  setPinnedConversations: (conversations: XmtpConversation[]) => void;

  deleteConversations: (topics: string[]) => void;
  updateConversationTopic: (
    oldTopic: string,
    conversation: XmtpConversation
  ) => void;
  setConversationMessageDraft: (topic: string, draft: string) => void;
  setConversationMediaPreview: (
    topic: string,
    mediaPreview: MediaPreview
  ) => void;

  setInitialLoadDone: () => void;
  setMessages: (messagesToSet: XmtpMessage[]) => void;
  updateMessagesIds: (
    updates: { topic: string; oldId: string; message: XmtpMessage }[]
  ) => void;
  updateMessageStatus: (
    topic: string,
    messageId: string,
    status: "delivered" | "error" | "seen" | "sending" | "sent" | "prepared"
  ) => void;

  setLocalClientConnected: (connected: boolean) => void;
  setResyncing: (syncing: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;
  setErrored: (errored: boolean) => void;
  setLastSyncedAt: (synced: number, topics: string[]) => void;

  setTopicsData: (
    topicsData: { [topic: string]: TopicData },
    markAsFetchedOnce?: boolean
  ) => void;

  setSpamScores: (topicSpamScores: TopicSpamScores) => void;

  // METHOD ONLY USED TEMPORARILY FOR WHEN WE SEND GROP MESSAGES
  deleteMessage: (topic: string, messageId: string) => void;

  setMessageMetadata: (
    topic: string,
    messageId: string,
    metadata: ConverseMessageMetadata
  ) => void;

  setConversationsLastNotificationSubscribePeriod: (
    topics: string[],
    period: number
  ) => void;

  messageAttachments: Record<string, Attachment>;

  setMessageAttachment: (messageId: string, attachment: Attachment) => void;

  groupInviteLinks: {
    [topic: string]: string;
  };
  setGroupInviteLink: (topic: string, inviteLink: string) => void;
  deleteGroupInviteLink: (topic: string) => void;

  reactionMenuMessageId: string | null;
  setReactMenuMessageId: (messageId: string | null) => void;
};

const now = () => new Date().getTime();

export const initChatStore = (account: string) => {
  const chatStore = create<ChatStoreType>()(
    persist(
      (set) =>
        ({
          conversations: {},
          pinnedConversations: [],
          lastSyncedAt: 0,
          lastSyncedTopics: [],
          topicsData: {},
          topicsDataFetchedOnce: false,
          openedConversationTopic: "",
          setOpenedConversationTopic: (topic) =>
            set((state) => {
              const newState = { ...state, openedConversationTopic: topic };
              if (topic && newState.conversations[topic]) {
                const conversation = newState.conversations[topic];
                const lastMessageId =
                  conversation.messagesIds.length > 0
                    ? conversation.messagesIds[
                        conversation.messagesIds.length - 1
                      ]
                    : undefined;
                if (lastMessageId) {
                  const lastMessage = conversation.messages.get(lastMessageId);
                  if (lastMessage) {
                    const newData = {
                      status: "read",
                      readUntil: lastMessage.sent,
                      timestamp: now(),
                    } as TopicData;
                    newState.topicsData[topic] = newData;
                    saveTopicsData(account, {
                      [topic]: newData,
                    });
                  }
                }
              }
              return newState;
            }),
          conversationsMapping: {},
          conversationsSortedOnce: false,
          sortedConversationsWithPreview: {
            conversationsInbox: [],
            conversationsRequests: [],
            conversationsBlocked: [],
          },
          setSortedConversationsWithPreview: (items) =>
            set(() => ({
              sortedConversationsWithPreview: items,
              conversationsSortedOnce: true,
            })),
          lastUpdateAt: 0,
          searchQuery: "",
          setSearchQuery: (q) => set(() => ({ searchQuery: q })),
          searchBarFocused: false,
          setSearchBarFocused: (f) => set(() => ({ searchBarFocused: f })),
          setConversations: (conversationsToSet) =>
            set((state) => {
              const conversations = { ...state.conversations };

              conversationsToSet.forEach((c) => {
                conversations[c.topic] = {
                  ...c,
                  messagesIds:
                    c.messagesIds && c.messagesIds.length > 0
                      ? c.messagesIds
                      : state.conversations[c.topic]?.messagesIds || [],
                  messages:
                    c.messages && c.messages.size > 0
                      ? c.messages
                      : state.conversations[c.topic]?.messages || new Map(),
                  readUntil:
                    c.readUntil || state.conversations[c.topic]?.readUntil || 0,
                  pending:
                    c.pending || state.conversations[c.topic]?.pending || false,
                  lastUpdateAt: now(),
                  hasOneMessageFromMe:
                    c.hasOneMessageFromMe ||
                    state.conversations[c.topic]?.hasOneMessageFromMe ||
                    false,
                  spamScore:
                    c.spamScore === undefined
                      ? state.conversations[c.topic]?.spamScore
                      : c.spamScore,
                };
              });

              setImmediate(() => {
                subscribeToNotifications(account);
              });

              return {
                ...state,
                conversations,
                lastUpdateAt: now(),
              };
            }),
          setPinnedConversations: (conversationsToSet) =>
            set((state) => {
              const conversations = { ...state.conversations };
              const pinnedConversations = state.pinnedConversations || [];

              conversationsToSet.forEach((c) => {
                const alreadyPinnedIndex = pinnedConversations.findIndex(
                  (item) => item.topic === c.topic
                );
                if (alreadyPinnedIndex !== -1) {
                  pinnedConversations.splice(alreadyPinnedIndex, 1);
                } else {
                  pinnedConversations.push(c);
                }
              });

              return {
                ...state,
                conversations,
              };
            }),

          deleteConversations: (topics) =>
            set(
              ({ conversations }) =>
                setImmediate(() => {
                  subscribeToNotifications(account);
                }) && {
                  conversations: omit(conversations, topics),
                }
            ),
          updateConversationTopic: (oldTopic, conversation) =>
            set((state) => {
              if (oldTopic in state.conversations) {
                logger.debug(
                  `TOPIC UPDATE: old topic ${oldTopic} to new topic ${conversation.topic}`
                );
                const newState = { ...state };
                const existingConversation = state.conversations[oldTopic];
                const oldMessages = existingConversation.messages;
                const oldMessagesIds = existingConversation.messagesIds;
                const oldHasOneMessageFromMe =
                  existingConversation.hasOneMessageFromMe;
                newState.conversations[conversation.topic] = {
                  ...conversation,
                  lastUpdateAt: now(),
                  messages: oldMessages,
                  messagesIds: oldMessagesIds,
                  hasOneMessageFromMe: oldHasOneMessageFromMe,
                };
                newState.lastUpdateAt = now();
                delete newState.conversations[oldTopic];
                newState.conversationsMapping[oldTopic] = conversation.topic;
                setImmediate(() => {
                  subscribeToNotifications(account);
                });
                return newState;
              } else {
                return state;
              }
            }),
          setConversationMessageDraft: (topic, messageDraft) =>
            set((state) => {
              if (!state.conversations[topic]) {
                logger.warn(
                  "[Error] Tried to set message draft on non existent conversation",
                  topic
                );
                return state;
              }
              const newState = { ...state };
              newState.conversations[topic].messageDraft = messageDraft;
              return newState;
            }),
          setConversationMediaPreview: (topic, mediaPreview) =>
            set((state) => {
              if (!state.conversations[topic]) {
                logger.warn(
                  "[Error] Tried to set media preview on non existent conversation",
                  topic
                );
                return state;
              }
              const newState = { ...state };
              newState.conversations[topic].mediaPreview = mediaPreview;
              return newState;
            }),
          setMessages: (messagesToSet) =>
            set((state) => {
              let isUpdated = false;
              let shouldResubscribe = false;
              let shouldRefreshBalance = false;
              const newState = {
                ...state,
              };

              const conversationsToHandleSpamScore: {
                [topic: string]: XmtpConversationWithUpdate;
              } = {};

              for (const message of messagesToSet) {
                const topic = message.topic;
                if (!newState.conversations[topic]) {
                  newState.conversations[topic] = {
                    messages: new Map(),
                    topic,
                    lastUpdateAt: now(),
                  } as XmtpConversationWithUpdate;
                  isUpdated = true;
                }
                if (
                  (isContentType("text", message.contentType) &&
                    message.content &&
                    message.content.includes("💸💸💸  just sent you $")) ||
                  isContentType("transactionReference", message.contentType) ||
                  isContentType("coinbasePayment", message.contentType)
                ) {
                  shouldRefreshBalance = true;
                }
                const conversation = newState.conversations[topic];
                if (
                  message.senderAddress === account &&
                  !conversation.hasOneMessageFromMe
                ) {
                  conversation.hasOneMessageFromMe = true;
                  conversation.lastUpdateAt = now();
                  isUpdated = true;
                  shouldResubscribe = true;
                }

                // Default message status is sent
                if (!message.status) message.status = "sent";
                const alreadyMessage = conversation.messages.get(message.id);
                // Do not override reactions when saving a message
                if (alreadyMessage) {
                  const newMessage = {
                    ...message,
                    reactions: alreadyMessage.reactions,
                  } as XmtpMessage;
                  // Existing message, let's see if we can consider it's updated
                  const messageUpdated = isMessageUpdated(
                    alreadyMessage,
                    newMessage
                  );

                  isUpdated = isUpdated || messageUpdated;
                  if (messageUpdated) {
                    newState.conversations[topic].lastUpdateAt = now();
                  }
                  insertMessageIdAtRightIndex(conversation, newMessage);
                } else {
                  // New message, it's updated
                  isUpdated = true;
                  newState.conversations[topic].lastUpdateAt = now();
                  insertMessageIdAtRightIndex(conversation, message);
                  if (state.openedConversationTopic === topic) {
                    const newReadUntil = Math.max(
                      message.sent,
                      newState.topicsData[topic]?.readUntil
                        ? (newState.topicsData[topic]?.readUntil as number)
                        : 0
                    );

                    const newData = {
                      status: "read",
                      readUntil: newReadUntil,
                      timestamp: now(),
                    } as TopicData;
                    newState.topicsData[topic] = newData;

                    saveTopicsData(account, {
                      [topic]: newData,
                    });
                  }
                }

                // Let's check if it's a reaction to a message
                if (
                  message.referencedMessageId &&
                  isContentType("reaction", message.contentType)
                ) {
                  const referencedMessage = conversation.messages.get(
                    message.referencedMessageId
                  );
                  // On web we are reading backwards so let's create the
                  // referencedMessage if it does not exist
                  if (referencedMessage) {
                    referencedMessage.reactions =
                      referencedMessage.reactions || new Map();
                    isUpdated = true;
                    newState.conversations[topic].lastUpdateAt = now();
                    if (!referencedMessage.reactions.has(message.id)) {
                      referencedMessage.reactions.set(message.id, message);
                      referencedMessage.lastUpdateAt = now();
                    }
                  } else if (Platform.OS === "web") {
                    isUpdated = true;
                    newState.conversations[topic].lastUpdateAt = now();
                    conversation.messages.set(message.referencedMessageId, {
                      id: message.referencedMessageId,
                      reactions: new Map().set(message.id, message),
                      lastUpdateAt: now(),
                    } as XmtpMessage);
                  }
                }

                // Set spamScore if needed, only after initial load is done
                if (
                  conversation.spamScore === undefined &&
                  state.initialLoadDoneOnce
                ) {
                  conversationsToHandleSpamScore[conversation.topic] =
                    conversation;
                }
              }

              const updateSpamScoreFor = Object.values(
                conversationsToHandleSpamScore
              );
              if (updateSpamScoreFor.length > 0) {
                setImmediate(() => {
                  computeConversationsSpamScores(account, updateSpamScoreFor);
                });
              }

              if (isUpdated) {
                newState.lastUpdateAt = now();
              }

              if (shouldResubscribe) {
                setImmediate(() => {
                  subscribeToNotifications(account);
                });
              }

              if (shouldRefreshBalance) {
                refreshBalanceForAccount(account);
              }

              return newState;
            }),
          initialLoadDone: false,
          initialLoadDoneOnce: false,
          setInitialLoadDone: () =>
            set((state) => {
              // Called at the end of the initial load.
              const newState = {
                ...state,
                initialLoadDone: true,
                initialLoadDoneOnce: true,
                lastUpdateAt: now(),
              };
              if (!state.initialLoadDoneOnce) {
                if (
                  state.topicsDataFetchedOnce &&
                  Object.keys(state.topicsData).length === 0
                ) {
                  const topicsUpdates = getTopicsUpdatesAsRead(
                    newState.conversations
                  );
                  newState.topicsData = topicsUpdates;
                  saveTopicsData(account, topicsUpdates);
                } else {
                  setTimeout(() => {
                    markConversationsAsReadIfNecessary(account);
                  }, 100);
                }
              }
              return newState;
            }),
          localClientConnected: false,
          setLocalClientConnected: (c) =>
            set(() => ({ localClientConnected: c })),
          resyncing: false,
          setResyncing: (syncing) => set(() => ({ resyncing: syncing })),
          reconnecting: false,
          setReconnecting: (reconnecting) => set(() => ({ reconnecting })),
          errored: false,
          setErrored: (errored) => set(() => ({ errored })),
          updateMessagesIds: (updates) =>
            set((state) => {
              if (updates.length === 0) return state;
              const newState = {
                ...state,
                lastUpdateAt: now(),
              };
              updates.forEach((messageToUpdate) => {
                if (newState.conversations[messageToUpdate.topic]) {
                  const conversation =
                    newState.conversations[messageToUpdate.topic];
                  conversation.lastUpdateAt = now();
                  const oldMessage = conversation.messages.get(
                    messageToUpdate.oldId
                  );
                  conversation.messages.delete(messageToUpdate.oldId);
                  // Avoid duplicate reactions saved in db
                  if (oldMessage && oldMessage.referencedMessageId) {
                    const referencedOldMessage = conversation.messages.get(
                      oldMessage.referencedMessageId
                    );
                    if (
                      referencedOldMessage &&
                      referencedOldMessage?.reactions?.get(oldMessage.id)
                    ) {
                      const oldReaction = referencedOldMessage.reactions.get(
                        oldMessage.id
                      );
                      if (oldReaction) {
                        referencedOldMessage?.reactions?.delete(oldMessage.id);
                        referencedOldMessage.reactions.set(
                          messageToUpdate.message.id,
                          messageToUpdate.message
                        );
                        referencedOldMessage.lastUpdateAt = now();
                      }
                    }
                  }
                  // // Transfer attachment URL to the new message
                  // if (oldMessage && state.messageAttachments[oldMessage.id]) {
                  //   const oldAttachment = state.messageAttachments[oldMessage.id];
                  //   const updatedAttachment = {
                  //     ...oldAttachment,
                  //     mediaURL: oldAttachment.mediaURL?.replace(oldMessage.id, messageToUpdate.message.id)
                  //   };
                  //   newState.messageAttachments[messageToUpdate.topic] = {
                  //     ...newState.messageAttachments[messageToUpdate.topic],
                  //     [messageToUpdate.message.id]: updatedAttachment
                  //   };
                  //   delete newState.messageAttachments[oldMessage.id];
                  // }

                  insertMessageIdAtRightIndex(
                    conversation,
                    messageToUpdate.message,
                    oldMessage?.id
                  );
                }
              });

              return newState;
            }),
          updateMessageStatus: (topic, messageId, status) =>
            set((state) => {
              if (
                !state.conversations[topic] ||
                !state.conversations[topic].messages.has(messageId)
              ) {
                return state;
              }
              const newState = {
                ...state,
                lastUpdateAt: now(),
              };
              const conversation = newState.conversations[topic];
              conversation.lastUpdateAt = now();
              const message = conversation.messages.get(messageId);
              if (message) {
                message.status = status;
              }

              return newState;
            }),
          setLastSyncedAt: (synced: number, topics: string[]) =>
            set(() => ({ lastSyncedAt: synced, lastSyncedTopics: topics })),
          setTopicsData: (
            topicsData: { [topic: string]: TopicData },
            markAsFetchedOnce?: boolean
          ) =>
            set((state) => {
              const newTopicsData = {
                ...state.topicsData,
              };
              Object.keys(topicsData).forEach((topic) => {
                const oldTopicData = (newTopicsData[topic] || {}) as TopicData;
                const oldReadUntil = oldTopicData.readUntil;
                const newReadUntil = topicsData[topic].readUntil;
                const oldTimestamp = oldTopicData.timestamp;
                const newTimestamp = topicsData[topic].timestamp;
                if (
                  (oldTimestamp &&
                    newTimestamp &&
                    newTimestamp < oldTimestamp) ||
                  (oldReadUntil && newReadUntil && newReadUntil < oldReadUntil)
                ) {
                  // Ignore because it's stale data
                } else {
                  newTopicsData[topic] = {
                    ...oldTopicData,
                    ...topicsData[topic],
                  };
                }
              });
              if (
                isDeepEqual(state.topicsData, newTopicsData) &&
                state.topicsDataFetchedOnce
              )
                return state;
              setImmediate(() => {
                subscribeToNotifications(account);
              });
              return {
                topicsData: newTopicsData,
                topicsDataFetchedOnce: markAsFetchedOnce
                  ? true
                  : state.topicsDataFetchedOnce,
                lastUpdateAt: now(),
              };
            }),
          setSpamScores: (topicSpamScores: Record<string, number>) =>
            set((state) => {
              const newState = {
                ...state,
                lastUpdateAt: now(),
              };
              Object.entries(topicSpamScores).forEach(([topic, spamScore]) => {
                newState.conversations[topic].spamScore = spamScore;
                newState.conversations[topic].lastUpdateAt = now();
              });
              return newState;
            }),
          // METHOD ONLY USED TEMPORARILY FOR WHEN WE SEND GROP MESSAGES
          deleteMessage: (topic: string, messageId: string) =>
            set((state) => {
              // We do not use lastUpdateAt so it should not show an update
              // until we get back the "real" message
              const newState = { ...state };
              if (newState.conversations[topic]) {
                const indexOf =
                  newState.conversations[topic]?.messagesIds.indexOf(messageId);
                if (indexOf > -1) {
                  newState.conversations[topic].messagesIds.splice(indexOf, 1);
                  newState.conversations[topic].messages.delete(messageId);
                }
              }
              return newState;
            }),
          setMessageMetadata: (
            topic: string,
            messageId: string,
            metadata: ConverseMessageMetadata
          ) =>
            set((state) => {
              const conversation = state.conversations[topic];
              if (!conversation) return state;
              const message = conversation.messages.get(messageId);
              if (!message) return state;
              const newState = { ...state };
              newState.conversations[topic].lastUpdateAt = now();
              newState.conversations[topic].messages.set(messageId, {
                ...message,
                converseMetadata: metadata,
                lastUpdateAt: now(),
              });
              return newState;
            }),
          setConversationsLastNotificationSubscribePeriod: (
            topics: string[],
            period: number
          ) =>
            set((state) => {
              const newConversations = { ...state.conversations };
              topics.forEach((topic) => {
                if (newConversations[topic]) {
                  newConversations[topic].lastNotificationsSubscribedPeriod =
                    period;
                }
              });
              return { conversations: newConversations };
            }),
          messageAttachments: {},
          setMessageAttachment(messageId, attachment) {
            set((state) => {
              const newMessageAttachments = { ...state.messageAttachments };
              newMessageAttachments[messageId] = attachment;
              return { messageAttachments: newMessageAttachments };
            });
          },
          groupInviteLinks: {},
          setGroupInviteLink(topic, inviteLink) {
            set((state) => {
              const newGroupInvites = { ...state.groupInviteLinks };
              newGroupInvites[topic] = inviteLink;
              return { groupInviteLinks: newGroupInvites };
            });
          },
          deleteGroupInviteLink(topic) {
            set((state) => {
              const newGroupInvites = { ...state.groupInviteLinks };
              delete newGroupInvites[topic];
              return { groupInviteLinks: newGroupInvites };
            });
          },
          reactionMenuMessageId: null,
          setReactMenuMessageId: (messageId) =>
            set(() => ({ reactionMenuMessageId: messageId })),
        }) as ChatStoreType,
      {
        name: `store-${account}-chat`, // Account-based storage so each account can have its own chat data
        storage: createJSONStorage(() => zustandMMKVStorage),
        // Only persisting the information we want
        partialize: (state) => {
          // Persist nothing in web
          if (Platform.OS === "web") {
            return undefined;
          }
          const persistedState: Partial<ChatStoreType> = {
            initialLoadDoneOnce: state.initialLoadDoneOnce,
            lastSyncedAt: state.lastSyncedAt,
            lastSyncedTopics: state.lastSyncedTopics,
            topicsData: state.topicsData,
            pinnedConversations: state.pinnedConversations,
            groupInviteLinks: state.groupInviteLinks,
          };
          // if (Platform.OS === "web" && state.conversations) {
          //   // On web, we persist convos without messages
          //   persistedState.conversations = {} as {
          //     [topic: string]: XmtpConversationWithUpdate;
          //   };
          //   Object.keys(state.conversations).forEach((topic) => {
          //     if (persistedState.conversations) {
          //       persistedState.conversations[topic] = {
          //         ...state.conversations[topic],
          //         messages: new Map(),
          //         messagesIds: [],
          //       };
          //     }
          //   });
          // }
          return persistedState;
        },
        version: 2,
        migrate: (persistedState: any, version: number): ChatStoreType => {
          logger.debug("Zustand migration version:", version);
          // Migration from version 0: Convert 'deletedTopics' to 'topicsStatus'
          if (version < 1 && persistedState.deletedTopics) {
            persistedState.topicsStatus = {};
            for (const [topic, isDeleted] of Object.entries(
              persistedState.deletedTopics
            )) {
              if (isDeleted) {
                persistedState.topicsStatus[topic] = "deleted";
              }
            }
            delete persistedState.deletedTopics;
          }
          if (version < 2 && persistedState.topicsStatus) {
            persistedState.topicsData = {};
            for (const [topic, status] of Object.entries(
              persistedState.topicsStatus
            )) {
              persistedState.topicsData[topic] = {
                status,
              };
            }
            delete persistedState.topicsStatus;
          }
          return persistedState as ChatStoreType;
        },
      }
    )
  );
  return chatStore;
};

const isMessageUpdated = (oldMessage: XmtpMessage, newMessage: XmtpMessage) => {
  const keysChangesToRerender: (keyof XmtpMessage)[] = ["id", "sent", "status"];
  return keysChangesToRerender.some((k) => {
    const keyUpdated = oldMessage[k] !== newMessage[k];
    return keyUpdated;
  });
};

const reverseRemoveElement = (array: string[], element: string) => {
  for (let index = array.length - 1; index >= 0; index--) {
    const sortedElement = array[index];
    if (sortedElement === element) {
      array.splice(index, 1);
      break;
    }
  }
};

const insertMessageIdAtRightIndex = (
  conversation: XmtpConversation,
  newMessage: XmtpMessage,
  replacingMessageId?: string
) => {
  conversation.messagesIds = conversation.messagesIds || [];
  const currentMessages = conversation.messages;
  const alreadyMessage = currentMessages.get(newMessage.id);
  if (alreadyMessage) {
    if (newMessage.sent === alreadyMessage.sent) {
      // Just update in place
      conversation.messages.set(newMessage.id, newMessage);
      return;
    } else {
      // If date change, let's remove existing position, it will
      // be reinserted at the right position
      reverseRemoveElement(conversation.messagesIds, newMessage.id);
    }
  }
  if (replacingMessageId) {
    reverseRemoveElement(conversation.messagesIds, replacingMessageId);
  }
  const lastMessageId =
    conversation.messagesIds.length > 0
      ? conversation.messagesIds[conversation.messagesIds.length - 1]
      : undefined;
  const lastMessage = lastMessageId
    ? currentMessages.get(lastMessageId)
    : undefined;
  if (lastMessageId && !lastMessage) {
    console.warn(`Message id ${lastMessageId} exists but no matching message`);
  }
  // Basic case is just push the message at the end
  if (!lastMessage || newMessage.sent >= lastMessage.sent) {
    conversation.messagesIds.push(newMessage.id);
    conversation.messages.set(newMessage.id, newMessage);
    return;
  }
  // More complicated case, we loop in reverse (since usually it will be one of
  // the last messages) and we find out the right position to insert
  for (let index = conversation.messagesIds.length - 1; index >= 0; index--) {
    const sortedMessageId = conversation.messagesIds[index];
    const sortedMessage = conversation.messages.get(sortedMessageId);
    if (sortedMessage && sortedMessage.sent < newMessage.sent) {
      // When we find an older message, we're ready to insert after it
      conversation.messagesIds.splice(index + 1, 0, newMessage.id);
      conversation.messages.set(newMessage.id, newMessage);
      return;
    }
  }
  // If the message to insert is the first (happens on web)
  // we push it at the beginning
  conversation.messagesIds.unshift(newMessage.id);
  conversation.messages.set(newMessage.id, newMessage);
};
