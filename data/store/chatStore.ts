import { Platform } from "react-native";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import {
  TopicSpamScores,
  handleSpamScore,
} from "../../data/helpers/conversations/spamScore";
import { ConversationWithLastMessagePreview } from "../../utils/conversation";
import { lastValueInMap } from "../../utils/map";
import { zustandMMKVStorage } from "../../utils/mmkv";
import { subscribeToNotifications } from "../../utils/notifications";
import { omit } from "../../utils/objects";
import { refreshBalanceForAccount } from "../../utils/wallet";
import { isContentType } from "../../utils/xmtpRN/contentTypes";
import {
  markAllConversationsAsReadInDb,
  markConversationReadUntil,
} from "../helpers/conversations/upsertConversations";

// Chat data for each user

type XmtpConversationContext = {
  conversationId: string;
  metadata: {
    [k: string]: string;
  };
};

export type XmtpConversation = {
  topic: string;
  peerAddress: string;
  createdAt: number;
  context?: XmtpConversationContext;
  messages: Map<string, XmtpMessage>;
  messagesIds: string[];
  conversationTitle?: string | null;
  messageDraft?: string;
  readUntil: number;
  hasOneMessageFromMe?: boolean;
  pending: boolean;
  version: string;
  spamScore?: number;
};

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
  status: "delivered" | "error" | "seen" | "sending" | "sent";
  sentViaConverse: boolean;
  reactions?: Map<string, XmtpMessage>;
  contentFallback?: string;
  referencedMessageId?: string;
  lastUpdateAt?: number;
};

type ConversationsListItems = {
  conversationsInbox: ConversationWithLastMessagePreview[];
  conversationsRequests: ConversationWithLastMessagePreview[];
};

export type ChatStoreType = {
  conversations: {
    [topic: string]: XmtpConversationWithUpdate;
  };
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
  topicsStatus: { [topic: string]: "deleted" | "consented" };

  conversationsSortedOnce: boolean;
  sortedConversationsWithPreview: ConversationsListItems;
  setSortedConversationsWithPreview: (items: ConversationsListItems) => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchBarFocused: boolean;
  setSearchBarFocused: (focused: boolean) => void;

  setConversations: (conversations: XmtpConversation[]) => void;
  deleteConversations: (topics: string[]) => void;
  updateConversationTopic: (
    oldTopic: string,
    conversation: XmtpConversation
  ) => void;
  setConversationMessageDraft: (topic: string, draft: string) => void;

  setInitialLoadDone: () => void;
  setInitialLoadDoneOnce: () => void;
  setMessages: (messagesToSet: XmtpMessage[]) => void;
  updateMessagesIds: (
    updates: { topic: string; oldId: string; message: XmtpMessage }[]
  ) => void;
  updateMessageStatus: (
    topic: string,
    messageId: string,
    status: "delivered" | "error" | "seen" | "sending" | "sent"
  ) => void;

  setLocalClientConnected: (connected: boolean) => void;
  setResyncing: (syncing: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;
  setLastSyncedAt: (synced: number, topics: string[]) => void;

  setTopicsStatus: (topicsStatus: {
    [topic: string]: "deleted" | "consented";
  }) => void;

  setSpamScores: (topicSpamScores: TopicSpamScores) => void;
};

const now = () => new Date().getTime();

export const initChatStore = (account: string) => {
  const recommendationsStore = create<ChatStoreType>()(
    persist(
      (set) =>
        ({
          conversations: {},
          lastSyncedAt: 0,
          lastSyncedTopics: [],
          topicsStatus: {},
          openedConversationTopic: "",
          setOpenedConversationTopic: (topic) =>
            set((state) => {
              const newState = { ...state, openedConversationTopic: topic };
              if (topic && newState.conversations[topic]) {
                const n = now();
                newState.conversations[topic].readUntil = n;
                // Also mark in db
                markConversationReadUntil(account, topic, n);
              }
              return newState;
            }),
          conversationsMapping: {},
          conversationsSortedOnce: false,
          sortedConversationsWithPreview: {
            conversationsInbox: [],
            conversationsRequests: [],
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
          deleteConversations: (topics) =>
            set(({ conversations }) => {
              setImmediate(() => {
                subscribeToNotifications(account);
              });
              return {
                conversations: omit(conversations, topics),
              };
            }),
          updateConversationTopic: (oldTopic, conversation) =>
            set((state) => {
              if (oldTopic in state.conversations) {
                console.log(
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
                console.log(
                  "[Error] Tried to set message draft on non existent conversation",
                  topic
                );
                return state;
              }
              const newState = { ...state };
              newState.conversations[topic].messageDraft = messageDraft;
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
                    conversation.readUntil = now();
                    // Also mark in db
                    markConversationReadUntil(
                      account,
                      conversation.topic,
                      conversation.readUntil
                    );
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
                    const alreadyReaction = referencedMessage.reactions.get(
                      message.id
                    );
                    if (!alreadyReaction) {
                      isUpdated = true;
                      newState.conversations[topic].lastUpdateAt = now();
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
                  updateSpamScoreFor.forEach((conversation) => {
                    handleSpamScore(account, conversation);
                  });
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
                // If it's the initial sync, let's mark
                // all conversations as read
                for (const topic in newState.conversations) {
                  const conversation = newState.conversations[topic];
                  conversation.lastUpdateAt = now();
                  if (conversation.messages.size > 0) {
                    const lastMessage = lastValueInMap(conversation.messages);
                    conversation.readUntil = lastMessage ? lastMessage.sent : 0;
                  }
                }
                markAllConversationsAsReadInDb(account);
              }
              return newState;
            }),
          setInitialLoadDoneOnce: () =>
            set(() => ({ initialLoadDoneOnce: true })),
          localClientConnected: false,
          setLocalClientConnected: (c) =>
            set(() => ({ localClientConnected: c })),
          resyncing: false,
          setResyncing: (syncing) => set(() => ({ resyncing: syncing })),
          reconnecting: false,
          setReconnecting: (reconnecting) => set(() => ({ reconnecting })),
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
          setTopicsStatus: (topicsStatus: {
            [topic: string]: "deleted" | "consented";
          }) =>
            set((state) => {
              setImmediate(() => {
                subscribeToNotifications(account);
              });
              return {
                topicsStatus: { ...state.topicsStatus, ...topicsStatus },
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
            topicsStatus: state.topicsStatus,
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
        version: 1,
        migrate: (persistedState: any, version: number): ChatStoreType => {
          console.log("Zustand migration version:", version);
          // Migration from version 0: Convert 'deletedTopics' to 'topicsStatus'
          if (version === 0 && persistedState.deletedTopics) {
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
          return persistedState as ChatStoreType;
        },
      }
    )
  );
  return recommendationsStore;
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
