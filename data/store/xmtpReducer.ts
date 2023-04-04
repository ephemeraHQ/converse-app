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
};

export type XmtpType = {
  localConnected: boolean;
  webviewConnected: boolean;
  initialLoadDone: boolean;
  initialLoadDoneOnce: boolean;
  loading: boolean;
  conversations: {
    [topic: string]: XmtpConversation;
  };
  lastUpdateAt: number;
  address?: string;
  blockedPeerAddresses: { [peerAddress: string]: boolean };
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
  XmtpInitialLoad = "XMTP_INITIAL_LOAD",
  XmtpInitialLoadDoneOnce = "XMTP_INITIAL_LOAD_DONE_ONCE",
  XmtpLoading = "XMTP_LOADING",
  XmtpSetCurrentMessageContent = "XMTP_SET_CURRENT_MESSAGE",
  XmtpSetBlockedStatus = "XMTP_SET_BLOCKED_STATUS",
  XmtpSetBlockedPeerAddresses = "XMTP_SET_BLOCKED_PEER_ADDRESSES",
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
};

export type XmtpActions = ActionMap<XmtpPayload>[keyof ActionMap<XmtpPayload>];

export const xmtpReducer = (state: XmtpType, action: XmtpActions): XmtpType => {
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
        };
      });

      return {
        ...state,
        lastUpdateAt: new Date().getTime(),
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
        lastUpdateAt: new Date().getTime(),
        conversations: {
          ...state.conversations,
          [action.payload.conversation.topic]: {
            ...action.payload.conversation,
            messages: new Map(),
            peerAddress: action.payload.conversation?.peerAddress || "",
          },
        },
      };
    }
    case XmtpDispatchTypes.XmtpInitialLoad: {
      mmkv.set("state.xmtp.initialLoadDoneOnce", true);
      return {
        ...state,
        initialLoadDone: true,
        initialLoadDoneOnce: true,
        lastUpdateAt: new Date().getTime(),
      };
    }

    case XmtpDispatchTypes.XmtpInitialLoadDoneOnce: {
      mmkv.set("state.xmtp.initialLoadDoneOnce", true);
      return {
        ...state,
        initialLoadDoneOnce: true,
        lastUpdateAt: new Date().getTime(),
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
        lastUpdateAt: new Date().getTime(),
      };
      newState.conversations[action.payload.topic] = newState.conversations[
        action.payload.topic
      ] || {
        messages: new Map(),
        topic: action.payload.topic,
      };
      const conversation = newState.conversations[action.payload.topic];
      for (const message of action.payload.messages) {
        // Default message status is sent
        if (!message.status) message.status = "sent";
        conversation.messages.set(message.id, message);
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

    default:
      return state;
  }
};
