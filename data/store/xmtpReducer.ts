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
  messages: XmtpMessage[];
};

export type XmtpType = {
  connected: boolean;
  webviewLoaded: boolean;
  initialLoadDone: boolean;
  loading: boolean;
  conversations: {
    [topic: string]: XmtpConversation;
  };
  lastUpdateAt: number;
  address?: string;
};

export const xmtpInitialState: XmtpType = {
  connected: false,
  webviewLoaded: false,
  initialLoadDone: false,
  loading: false,
  conversations: {},
  address: undefined,
  lastUpdateAt: 0,
};

export type XmtpMessage = {
  id: string;
  senderAddress: string;
  sent: number;
  content: string;
  lazy?: boolean;
};

export enum XmtpDispatchTypes {
  XmtpConnected = "XMTP_CONNECTED",
  XmtpWebviewLoaded = "XMTP_WEBVIEW_LOADED",
  XmtpSetConversations = "XMTP_SET_CONVERSATIONS",
  XmtpNewConversation = "XMTP_NEW_CONVERSATION",
  XmtpSetAddress = "XMTP_SET_ADDRESS",
  XmtpSetMessages = "XMTP_SET_MESSAGES",
  XmtpInitialLoad = "XMTP_INITIAL_LOAD",
  XmtpLoading = "XMTP_LOADING",
}

type XmtpPayload = {
  [XmtpDispatchTypes.XmtpConnected]: {
    connected: boolean;
  };
  [XmtpDispatchTypes.XmtpWebviewLoaded]: {
    loaded: boolean;
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
  [XmtpDispatchTypes.XmtpLoading]: {
    loading: boolean;
  };
  [XmtpDispatchTypes.XmtpInitialLoad]: undefined;
};

export type XmtpActions = ActionMap<XmtpPayload>[keyof ActionMap<XmtpPayload>];

export const xmtpReducer = (state: XmtpType, action: XmtpActions): XmtpType => {
  switch (action.type) {
    case XmtpDispatchTypes.XmtpSetAddress:
      return {
        ...state,
        address: action.payload.address,
      };
    case XmtpDispatchTypes.XmtpConnected:
      if (!action.payload.connected) {
        return { ...xmtpInitialState, webviewLoaded: state.webviewLoaded };
      }
      return {
        ...state,
        connected: action.payload.connected,
      };
    case XmtpDispatchTypes.XmtpWebviewLoaded:
      return {
        ...state,
        webviewLoaded: action.payload.loaded,
      };
    case XmtpDispatchTypes.XmtpSetConversations: {
      const conversations: {
        [topic: string]: XmtpConversation;
      } = {};

      action.payload.conversations.forEach((c) => {
        conversations[c.topic] = {
          ...c,
          messages: c.messages || state.conversations[c.topic]?.messages || [],
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
            messages: [],
          },
        },
      };
    }
    case XmtpDispatchTypes.XmtpInitialLoad: {
      return {
        ...state,
        initialLoadDone: true,
      };
    }

    case XmtpDispatchTypes.XmtpLoading: {
      return {
        ...state,
        loading: action.payload.loading,
      };
    }

    case XmtpDispatchTypes.XmtpSetMessages: {
      const conversation = state.conversations[action.payload.topic];
      if (!conversation) return state;
      const newState = {
        ...state,
        lastUpdateAt: new Date().getTime(),
      };
      for (const message of action.payload.messages) {
        const alreadyMessageWithId = conversation.messages.find(
          (m) => m.id === message.id
        );
        if (alreadyMessageWithId) {
          continue;
        }
        const lazyMessageWithContentIndex = conversation.messages.findIndex(
          (m) => m.content === message.content && m.lazy
        );
        if (lazyMessageWithContentIndex > -1) {
          conversation.messages.splice(lazyMessageWithContentIndex, 1);
        }
        conversation.messages.unshift(message);
      }

      return newState;
    }

    default:
      return state;
  }
};
