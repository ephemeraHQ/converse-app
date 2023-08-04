import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { lastValueInMap } from "../../utils/map";
import { zustandMMKVStorage } from "../../utils/mmkv";
import { omit } from "../../utils/objects";
import { markAllConversationsAsReadInDb } from "../helpers/conversations/upsertConversations";

// Chat data for each user

export type XmtpConversationContext = {
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
  reactions?: string;
  contentFallback?: string;
};

export type ChatStoreType = {
  conversations: {
    [topic: string]: XmtpConversationWithUpdate;
  };

  conversationsMapping: {
    [oldTopic: string]: string;
  };
  lastUpdateAt: number;
  initialLoadDone: boolean;
  initialLoadDoneOnce: boolean;
  localClientConnected: boolean;
  webviewClientConnected: boolean;
  resyncing: boolean;
  reconnecting: boolean;

  setConversations: (conversations: XmtpConversation[]) => void;
  deleteConversations: (topics: string[]) => void;
  updateConversationTopic: (
    oldTopic: string,
    conversation: XmtpConversation
  ) => void;
  setConversationMessageDraft: (topic: string, draft: string) => void;

  setInitialLoadDone: () => void;
  setMessages: (topic: string, messagesToSet: XmtpMessage[]) => void;
  setMessagesReactions: (
    topic: string,
    reactions: { [messageId: string]: string }
  ) => void;
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
};

const now = () => new Date().getTime();

export const initChatStore = (account: string) => {
  const recommendationsStore = create<ChatStoreType>()(
    persist(
      (set) =>
        ({
          conversations: {},
          conversationsMapping: {},
          lastUpdateAt: 0,
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
              const newState = {
                ...state,
                lastUpdateAt: now(),
              };
              newState.conversations[topic] = newState.conversations[topic] || {
                messages: new Map(),
                topic,
              };
              const conversation = newState.conversations[topic];
              conversation.lastUpdateAt = now();
              for (const message of messagesToSet) {
                // Default message status is sent
                if (!message.status) message.status = "sent";
                const alreadyMessage = conversation.messages.get(message.id);
                // Do not override reactions when saving a message
                if (alreadyMessage) {
                  const newMessage = {
                    ...message,
                    reactions: alreadyMessage.reactions,
                  };
                  conversation.messages.set(message.id, newMessage);
                } else {
                  conversation.messages.set(message.id, message);
                }
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
                markAllConversationsAsReadInDb();
              }
              return newState;
            }),
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
          setMessagesReactions: (topic, reactionsToSet) =>
            set((state) => {
              if (!state.conversations[topic]) return state;
              const newState = {
                ...state,
                lastUpdateAt: now(),
              };
              const conversation = newState.conversations[topic];
              for (const messageId in reactionsToSet) {
                const message = conversation.messages.get(messageId);
                if (!message) {
                  continue;
                }
                const reactions = reactionsToSet[messageId];
                conversation.lastUpdateAt = now();
                conversation.messages.set(messageId, { ...message, reactions });
              }
              return newState;
            }),
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
                  conversation.messages.delete(messageToUpdate.oldId);
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
        } as ChatStoreType),
      {
        name: `store-${account}-chat`, // Account-based storage so each account can have its own chat data
        storage: createJSONStorage(() => zustandMMKVStorage),
        // Only persisting the information we want
        partialize: (state) => ({
          initialLoadDoneOnce: state.initialLoadDoneOnce, // This one we want to persist!
        }),
      }
    )
  );
  return recommendationsStore;
};
