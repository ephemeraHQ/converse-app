import { markAllConversationsAsReadInDb } from "..";
import { lastValueInMap } from "../../utils/map";
import mmkv from "../../utils/mmkv";
import {
  deleteLoggedXmtpAddress,
  saveLoggedXmtpAddress,
} from "../../utils/sharedData/sharedData";
import { ActionMap } from "./types";

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
  lensHandle?: string | null;
  ensName?: string | null;
  currentMessage?: string;
  readUntil: number;
};

export type XmtpConversationWithUpdate = XmtpConversation & {
  lastUpdateAt: number;
};

export type XmtpType = {
  localConnected: boolean;
  webviewConnected: boolean;
  initialLoadDone: boolean;
  initialLoadDoneOnce: boolean;
  loading: boolean;
  conversations: {
    [topic: string]: XmtpConversationWithUpdate;
  };
  lastUpdateAt: number;
  address?: string;
  blockedPeerAddresses: { [peerAddress: string]: boolean };
  reconnecting: boolean;
};

export const xmtpInitialState: XmtpType = {
  localConnected: false,
  webviewConnected: false,
  initialLoadDone: false,
  initialLoadDoneOnce: false,
  loading: false,
  conversations: {},
  address: undefined,
  lastUpdateAt: 0,
  blockedPeerAddresses: {},
  reconnecting: false,
};

type XmtpProtocolMessage = {
  id: string;
  senderAddress: string;
  sent: number;
  content: string;
};

export type XmtpMessage = XmtpProtocolMessage & {
  status: "delivered" | "error" | "seen" | "sending" | "sent";
};

export enum XmtpDispatchTypes {
  XmtpLocalConnected = "XMTP_LOCAL_CONNECTED",
  XmtpWebviewConnected = "XMTP_WEBVIEW_CONNECTED",
  XmtpSetConversations = "XMTP_SET_CONVERSATIONS",
  XmtpNewConversation = "XMTP_NEW_CONVERSATION",
  XmtpSetAddress = "XMTP_SET_ADDRESS",
  XmtpSetMessages = "XMTP_SET_MESSAGES",
  XmtpUpdateMessageIds = "XMTP_UPDATE_MESSAGE_IDS",
  XmtpUpdateMessageStatus = "XMTP_UPDATE_MESSAGE_STATUS",
  XmtpInitialLoad = "XMTP_INITIAL_LOAD",
  XmtpInitialLoadDoneOnce = "XMTP_INITIAL_LOAD_DONE_ONCE",
  XmtpLoading = "XMTP_LOADING",
  XmtpSetCurrentMessageContent = "XMTP_SET_CURRENT_MESSAGE",
  XmtpSetBlockedStatus = "XMTP_SET_BLOCKED_STATUS",
  XmtpSetBlockedPeerAddresses = "XMTP_SET_BLOCKED_PEER_ADDRESSES",
  XmtpSetReconnecting = "XMTP_SET_RECONNECTING",
}

type XmtpPayload = {
  [XmtpDispatchTypes.XmtpLocalConnected]: {
    connected: boolean;
  };
  [XmtpDispatchTypes.XmtpWebviewConnected]: {
    connected: boolean;
  };
  [XmtpDispatchTypes.XmtpSetConversations]: {
    conversations: XmtpConversation[];
  };
  [XmtpDispatchTypes.XmtpNewConversation]: {
    conversation: XmtpConversation;
  };
  [XmtpDispatchTypes.XmtpSetAddress]: {
    address: string;
  };
  [XmtpDispatchTypes.XmtpSetMessages]: {
    topic: string;
    messages: XmtpMessage[];
  };
  [XmtpDispatchTypes.XmtpUpdateMessageIds]: {
    topic: string;
    oldId: string;
    message: XmtpMessage;
  }[];
  [XmtpDispatchTypes.XmtpUpdateMessageStatus]: {
    messageId: string;
    topic: string;
    status: "delivered" | "error" | "seen" | "sending" | "sent";
  };
  [XmtpDispatchTypes.XmtpSetCurrentMessageContent]: {
    topic: string;
    content: string;
  };
  [XmtpDispatchTypes.XmtpLoading]: {
    loading: boolean;
  };
  [XmtpDispatchTypes.XmtpInitialLoad]: undefined;
  [XmtpDispatchTypes.XmtpInitialLoadDoneOnce]: undefined;
  [XmtpDispatchTypes.XmtpSetBlockedStatus]: {
    peerAddress: string;
    blocked: boolean;
  };
  [XmtpDispatchTypes.XmtpSetBlockedPeerAddresses]: {
    blockedPeerAddresses: { [peerAddress: string]: boolean };
  };
  [XmtpDispatchTypes.XmtpSetReconnecting]: {
    reconnecting: boolean;
  };
};

export type XmtpActions = ActionMap<XmtpPayload>[keyof ActionMap<XmtpPayload>];

export const xmtpReducer = (state: XmtpType, action: XmtpActions): XmtpType => {
  const now = new Date().getTime();
  switch (action.type) {
    case XmtpDispatchTypes.XmtpSetAddress:
      saveLoggedXmtpAddress(action.payload.address);
      return {
        ...state,
        address: action.payload.address,
      };
    case XmtpDispatchTypes.XmtpWebviewConnected:
      if (!action.payload.connected) {
        deleteLoggedXmtpAddress();
        // Disconnecting = reset state
        return { ...xmtpInitialState };
      }
      return {
        ...state,
        webviewConnected: action.payload.connected,
      };
    case XmtpDispatchTypes.XmtpLocalConnected:
      if (!action.payload.connected) {
        deleteLoggedXmtpAddress();
        // Disconnecting = reset state
        return { ...xmtpInitialState };
      }
      return {
        ...state,
        localConnected: action.payload.connected,
      };
    case XmtpDispatchTypes.XmtpSetCurrentMessageContent: {
      const newState = { ...state };
      newState.conversations[action.payload.topic].currentMessage =
        action.payload.content;
      return newState;
    }
    case XmtpDispatchTypes.XmtpSetConversations: {
      const conversations = { ...state.conversations };

      action.payload.conversations.forEach((c) => {
        conversations[c.topic] = {
          ...c,
          messages:
            c.messages?.size > 0
              ? c.messages
              : state.conversations[c.topic]?.messages || new Map(),
          readUntil:
            c.readUntil || state.conversations[c.topic]?.readUntil || 0,
          lastUpdateAt: now,
        };
      });

      return {
        ...state,
        lastUpdateAt: now,
        conversations,
      };
    }
    case XmtpDispatchTypes.XmtpNewConversation: {
      const alreadyConversation = Object.keys(state.conversations).includes(
        action.payload.conversation.topic
      );
      if (alreadyConversation) return state;
      return {
        ...state,
        lastUpdateAt: now,
        conversations: {
          ...state.conversations,
          [action.payload.conversation.topic]: {
            ...action.payload.conversation,
            messages: new Map(),
            peerAddress: action.payload.conversation?.peerAddress || "",
            lastUpdateAt: now,
          },
        },
      };
    }
    case XmtpDispatchTypes.XmtpInitialLoad: {
      // Called at the end of the initial load.
      const newState = {
        ...state,
        initialLoadDone: true,
        initialLoadDoneOnce: true,
        lastUpdateAt: now,
      };
      if (!state.initialLoadDoneOnce) {
        // If it's the initial sync, let's mark
        // all conversations as read
        for (const topic in newState.conversations) {
          const conversation = newState.conversations[topic];
          conversation.lastUpdateAt = now;
          if (conversation.messages.size > 0) {
            const lastMessage = lastValueInMap(conversation.messages);
            conversation.readUntil = lastMessage ? lastMessage.sent : 0;
          }
        }
        markAllConversationsAsReadInDb();
      }
      mmkv.set("state.xmtp.initialLoadDoneOnce", true);
      return newState;
    }

    case XmtpDispatchTypes.XmtpInitialLoadDoneOnce: {
      // Called during hydration to remember we've
      // loaded everything at least once
      mmkv.set("state.xmtp.initialLoadDoneOnce", true);
      return {
        ...state,
        initialLoadDoneOnce: true,
        lastUpdateAt: now,
      };
    }

    case XmtpDispatchTypes.XmtpLoading: {
      return {
        ...state,
        loading: action.payload.loading,
      };
    }

    case XmtpDispatchTypes.XmtpSetMessages: {
      const newState = {
        ...state,
        lastUpdateAt: now,
      };
      newState.conversations[action.payload.topic] = newState.conversations[
        action.payload.topic
      ] || {
        messages: new Map(),
        topic: action.payload.topic,
      };
      const conversation = newState.conversations[action.payload.topic];
      conversation.lastUpdateAt = now;
      for (const message of action.payload.messages) {
        // Default message status is sent
        if (!message.status) message.status = "sent";
        conversation.messages.set(message.id, message);
      }

      return newState;
    }

    case XmtpDispatchTypes.XmtpUpdateMessageIds: {
      if (action.payload.length === 0) return state;
      const newState = {
        ...state,
        lastUpdateAt: now,
      };
      action.payload.forEach((messageToUpdate) => {
        if (newState.conversations[messageToUpdate.topic]) {
          const conversation = newState.conversations[messageToUpdate.topic];
          conversation.lastUpdateAt = now;
          conversation.messages.delete(messageToUpdate.oldId);
          conversation.messages.set(
            messageToUpdate.message.id,
            messageToUpdate.message
          );
        }
      });

      return newState;
    }

    case XmtpDispatchTypes.XmtpUpdateMessageStatus: {
      if (
        !state.conversations[action.payload.topic] ||
        !state.conversations[action.payload.topic].messages.has(
          action.payload.messageId
        )
      ) {
        return state;
      }
      const newState = {
        ...state,
        lastUpdateAt: now,
      };
      const conversation = newState.conversations[action.payload.topic];
      conversation.lastUpdateAt = now;
      const message = conversation.messages.get(action.payload.messageId);
      if (message) {
        message.status = action.payload.status;
      }

      return newState;
    }

    case XmtpDispatchTypes.XmtpSetBlockedStatus: {
      const blockedPeerAddresses = { ...state.blockedPeerAddresses };
      if (action.payload.blocked) {
        blockedPeerAddresses[action.payload.peerAddress.toLowerCase()] = true;
      } else {
        delete blockedPeerAddresses[action.payload.peerAddress.toLowerCase()];
      }
      mmkv.set(
        "state.xmtp.blockedPeerAddresses",
        JSON.stringify(blockedPeerAddresses)
      );
      return {
        ...state,
        blockedPeerAddresses,
      };
    }

    case XmtpDispatchTypes.XmtpSetBlockedPeerAddresses: {
      mmkv.set(
        "state.xmtp.blockedPeerAddresses",
        JSON.stringify(action.payload.blockedPeerAddresses)
      );
      return {
        ...state,
        blockedPeerAddresses: action.payload.blockedPeerAddresses,
      };
    }

    case XmtpDispatchTypes.XmtpSetReconnecting: {
      return { ...state, reconnecting: action.payload.reconnecting };
    }

    default:
      return state;
  }
};
