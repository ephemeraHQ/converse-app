import logger from "@utils/logger";
import isDeepEqual from "fast-deep-equal";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { RemoteAttachmentContent } from "@xmtp/react-native-sdk";
import { Nullable } from "../../types/general";
import { zustandMMKVStorage } from "../../utils/mmkv";
import { subscribeToNotifications } from "../../utils/notifications";

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
  messageDraft?: string;
  mediaPreview?: MessageAttachment;
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
  groupCreator?: undefined;
  groupAddedBy?: undefined;
};

/**
 * @deprecated - Use the conversation from query instead
 */
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

/**
 * @deprecated - Use the conversation from query instead
 */
export type XmtpConversation = XmtpDMConversation | XmtpGroupConversation;

/**
 * @deprecated - Use the conversation from query instead
 */
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

/**
 * @deprecated - Use DecodedMessageWithCodeca instead
 */
export type XmtpMessage = XmtpProtocolMessage & {
  status: "delivered" | "error" | "seen" | "sending" | "sent" | "prepared";
  reactions?: Map<string, XmtpMessage>;
  contentFallback?: string;
  referencedMessageId?: string;
  lastUpdateAt?: number;
  localMediaURI?: string;
};

export type TopicData = {
  status: "deleted" | "unread" | "read";
  readUntil?: number;
  timestamp?: number;
  isPinned?: boolean;
};

export type TopicsData = {
  [topic: string]: TopicData | undefined;
};

export type MessageAttachmentStatus =
  | "picked"
  | "uploading"
  | "uploaded"
  | "error"
  | "sending";

export type MessageAttachmentPreview = {
  mediaURI: string;
  mimeType: Nullable<string>;
  dimensions?: {
    width: number;
    height: number;
  };
};

export type MessageAttachmentUploaded = MessageAttachmentPreview &
  RemoteAttachmentContent;

export type MessageAttachment =
  | MessageAttachmentPreview
  | MessageAttachmentUploaded
  | null;

export type MessageAttachmentTodo = {
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
  /**
   * @deprecated - Use the conversation from query instead
   */
  conversations: {
    [topic: string]: XmtpConversationWithUpdate;
  };
  pinnedConversationTopics: string[];
  openedConversationTopic: string | null;
  // setOpenedConversationTopic: (topic: string | null) => void;
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

  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchBarFocused: boolean;
  setSearchBarFocused: (focused: boolean) => void;

  setPinnedConversations: (conversationsTopics: string[]) => void;

  setInitialLoadDone: () => void;

  setLocalClientConnected: (connected: boolean) => void;
  setResyncing: (syncing: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;
  setErrored: (errored: boolean) => void;
  setLastSyncedAt: (synced: number, topics: string[]) => void;

  setTopicsData: (
    topicsData: { [topic: string]: TopicData },
    markAsFetchedOnce?: boolean
  ) => void;

  // setConversationsLastNotificationSubscribePeriod: (
  //   topics: string[],
  //   period: number
  // ) => void;

  messageAttachments: Record<string, MessageAttachmentTodo>;

  setMessageAttachment: (
    messageId: string,
    attachment: MessageAttachmentTodo
  ) => void;

  groupInviteLinks: {
    [topic: string]: string;
  };
  setGroupInviteLink: (topic: string, inviteLink: string) => void;
  deleteGroupInviteLink: (topic: string) => void;

  reactingToMessage: { topic: string; messageId: string } | null;
  setReactingToMessage: (
    r: { topic: string; messageId: string } | null
  ) => void;
};

const now = () => new Date().getTime();

export const initChatStore = (account: string) => {
  const chatStore = create<ChatStoreType>()(
    persist(
      (set) =>
        ({
          conversations: {},
          pinnedConversationTopics: [],
          lastSyncedAt: 0,
          lastSyncedTopics: [],
          topicsData: {},
          topicsDataFetchedOnce: false,
          openedConversationTopic: "",
          // setOpenedConversationTopic: (topic) =>
          //   set((state) => {
          //     const newState = { ...state, openedConversationTopic: topic };
          //     if (topic && newState.conversations[topic]) {
          //       const conversation = newState.conversations[topic];
          //       const lastMessageId =
          //         conversation.messagesIds.length > 0
          //           ? conversation.messagesIds[
          //               conversation.messagesIds.length - 1
          //             ]
          //           : undefined;
          //       if (lastMessageId) {
          //         const lastMessage = conversation.messages.get(lastMessageId);
          //         if (lastMessage) {
          //           const newData = {
          //             status: "read",
          //             readUntil: lastMessage.sent,
          //             timestamp: now(),
          //           } as TopicData;
          //           newState.topicsData[topic] = newData;
          //           saveTopicsData(account, {
          //             [topic]: newData,
          //           });
          //         }
          //       }
          //     }
          //     return newState;
          //   }),
          conversationsMapping: {},
          conversationsSortedOnce: false,
          lastUpdateAt: 0,
          searchQuery: "",
          setSearchQuery: (q) => set(() => ({ searchQuery: q })),
          searchBarFocused: false,
          setSearchBarFocused: (f) => set(() => ({ searchBarFocused: f })),
          setPinnedConversations: (conversationsTopics: string[]) =>
            set((state) => {
              const pinnedConversations = [
                ...(state.pinnedConversationTopics || []),
              ];
              conversationsTopics.forEach((topic) => {
                const alreadyPinnedIndex = pinnedConversations.findIndex(
                  (item) => item === topic
                );
                if (alreadyPinnedIndex !== -1) {
                  pinnedConversations.splice(alreadyPinnedIndex, 1);
                } else {
                  pinnedConversations.push(topic);
                }
              });
              return {
                pinnedConversationTopics: pinnedConversations,
              };
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
              // if (!state.initialLoadDoneOnce) {
              //   if (
              //     state.topicsDataFetchedOnce &&
              //     Object.keys(state.topicsData).length === 0
              //   ) {
              //     const topicsUpdates = getTopicsUpdatesAsRead(
              //       newState.conversations
              //     );
              //     newState.topicsData = topicsUpdates;
              //     saveTopicsData(account, topicsUpdates);
              //   } else {
              //     setTimeout(() => {
              //       markConversationsAsReadIfNecessary(account);
              //     }, 100);
              //   }
              // }
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
          // setConversationsLastNotificationSubscribePeriod: (
          //   topics: string[],
          //   period: number
          // ) =>
          //   set((state) => {
          //     const newConversations = { ...state.conversations };
          //     topics.forEach((topic) => {
          //       if (newConversations[topic]) {
          //         newConversations[topic].lastNotificationsSubscribedPeriod =
          //           period;
          //       }
          //     });
          //     return { conversations: newConversations };
          //   }),
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
          reactingToMessage: null,
          setReactingToMessage: (
            r: { topic: string; messageId: string } | null
          ) => set(() => ({ reactingToMessage: r })),
        }) as ChatStoreType,
      {
        name: `store-${account}-chat`, // Account-based storage so each account can have its own chat data
        storage: createJSONStorage(() => zustandMMKVStorage),
        // Only persisting the information we want
        partialize: (state) => {
          // Persist nothing in web

          const persistedState: Partial<ChatStoreType> = {
            initialLoadDoneOnce: state.initialLoadDoneOnce,
            lastSyncedAt: state.lastSyncedAt,
            lastSyncedTopics: state.lastSyncedTopics,
            topicsData: state.topicsData,
            pinnedConversationTopics: state.pinnedConversationTopics,
            groupInviteLinks: state.groupInviteLinks,
          };

          return persistedState;
        },
        version: 3,
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
          if (version < 3) {
            const fullConversations: unknown[] =
              persistedState.pinnedConversations;
            persistedState.pinnedConversationTopics =
              fullConversations?.map((it) => (it as { topic: string }).topic) ??
              [];
            delete persistedState.pinnedConversations;
          }
          return persistedState as ChatStoreType;
        },
      }
    )
  );
  return chatStore;
};
