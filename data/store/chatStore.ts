import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { lastValueInMap } from "../../utils/map";
import { zustandMMKVStorage } from "../../utils/mmkv";
import { omit } from "../../utils/objects";
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
  conversationTitle?: string | null;
  messageDraft?: string;
  readUntil: number;
  pending: boolean;
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
};

export type XmtpMessage = XmtpProtocolMessage & {
  status: "delivered" | "error" | "seen" | "sending" | "sent";
  sentViaConverse: boolean;
  reactions?: Map<string, XmtpMessage>;
  contentFallback?: string;
  referencedMessageId?: string;
  lastUpdateAt?: number;
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
  initialLoadDone: boolean;
  initialLoadDoneOnce: boolean;
  localClientConnected: boolean;
  webviewClientConnected: boolean;
  resyncing: boolean;
  reconnecting: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  setConversations: (conversations: XmtpConversation[]) => void;
  deleteConversations: (topics: string[]) => void;
  updateConversationTopic: (
    oldTopic: string,
    conversation: XmtpConversation
  ) => void;
  setConversationMessageDraft: (topic: string, draft: string) => void;

  setInitialLoadDone: () => void;
  setInitialLoadDoneOnce: () => void;
  setMessages: (topic: string, messagesToSet: XmtpMessage[]) => void;
  updateMessagesIds: (
    updates: { topic: string; oldId: string; message: XmtpMessage }[]
  ) => void;
  updateMessageStatus: (
    topic: string,
    messageId: string,
    status: "delivered" | "error" | "seen" | "sending" | "sent"
  ) => void;

  setLocalClientConnected: (connected: boolean) => void;
  setWebviewClientConnected: (connected: boolean) => void;
  setResyncing: (syncing: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;
  setLastSyncedAt: (synced: number) => void;
};

const now = () => new Date().getTime();

export const initChatStore = (account: string) => {
  const recommendationsStore = create<ChatStoreType>()(
    persist(
      (set) =>
        ({
          conversations: {},
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
          lastUpdateAt: 0,

          searchQuery: "",
          setSearchQuery: (q) => set(() => ({ searchQuery: q })),

          setConversations: (conversationsToSet) =>
            set((state) => {
              const conversations = { ...state.conversations };

              conversationsToSet.forEach((c) => {
                conversations[c.topic] = {
                  ...c,
                  messages:
                    c.messages?.size > 0
                      ? c.messages
                      : state.conversations[c.topic]?.messages || new Map(),
                  readUntil:
                    c.readUntil || state.conversations[c.topic]?.readUntil || 0,
                  pending:
                    c.pending || state.conversations[c.topic]?.pending || false,
                  lastUpdateAt: now(),
                };
              });

              return {
                ...state,
                conversations,
                lastUpdateAt: now(),
              };
            }),
          deleteConversations: (topics) =>
            set(({ conversations }) => ({
              conversations: omit(conversations, topics),
            })),
          updateConversationTopic: (oldTopic, conversation) =>
            set((state) => {
              if (oldTopic in state.conversations) {
                console.log(
                  `TOPIC UPDATE: old topic ${oldTopic} to new topic ${conversation.topic}`
                );
                const newState = { ...state };
                const existingConversation = state.conversations[oldTopic];
                const oldMessages = existingConversation.messages;
                newState.conversations[conversation.topic] = {
                  ...conversation,
                  lastUpdateAt: now(),
                  messages: oldMessages,
                };
                newState.lastUpdateAt = now();

                delete newState.conversations[oldTopic];
                newState.conversationsMapping[oldTopic] = conversation.topic;
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
          setMessages: (topic, messagesToSet) =>
            set((state) => {
              let isUpdated = false;
              const newState = {
                ...state,
              };
              if (!newState.conversations[topic]) {
                newState.conversations[topic] = {
                  messages: new Map(),
                  topic,
                } as XmtpConversationWithUpdate;
                isUpdated = true;
              }

              const conversation = newState.conversations[topic];
              for (const message of messagesToSet) {
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
                  isUpdated =
                    isUpdated || isMessageUpdated(alreadyMessage, newMessage);
                  conversation.messages.set(message.id, newMessage);
                } else {
                  // New message, it's updated
                  isUpdated = true;
                  conversation.messages.set(message.id, message);
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
                  message.contentType.startsWith("xmtp.org/reaction:")
                ) {
                  const referencedMessage = conversation.messages.get(
                    message.referencedMessageId
                  );
                  if (referencedMessage) {
                    referencedMessage.reactions =
                      referencedMessage.reactions || new Map();
                    const alreadyReaction = referencedMessage.reactions.get(
                      message.id
                    );
                    if (!alreadyReaction) {
                      isUpdated = true;
                      referencedMessage.reactions.set(message.id, message);
                      referencedMessage.lastUpdateAt = now();
                    }
                  }
                }
              }

              if (isUpdated) {
                newState.lastUpdateAt = now();
                newState.conversations[topic].lastUpdateAt = now();
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
          webviewClientConnected: false,
          setWebviewClientConnected: (c) =>
            set(() => ({ webviewClientConnected: c })),
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
                  conversation.messages.set(
                    messageToUpdate.message.id,
                    messageToUpdate.message
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
          setLastSyncedAt: (synced: number) =>
            set(() => ({ lastSyncedAt: synced })),
        }) as ChatStoreType,
      {
        name: `store-${account}-chat`, // Account-based storage so each account can have its own chat data
        storage: createJSONStorage(() => zustandMMKVStorage),
        // Only persisting the information we want
        partialize: (state) => ({
          initialLoadDoneOnce: state.initialLoadDoneOnce,
          lastSyncedAt: state.lastSyncedAt,
        }),
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
