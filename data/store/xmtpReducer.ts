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
  lazyMessages: XmtpMessage[];
  lensHandle?: string;
  ensName?: string;
  currentMessage?: string;
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
};

export enum XmtpDispatchTypes {
  XmtpConnected = "XMTP_CONNECTED",
  XmtpWebviewLoaded = "XMTP_WEBVIEW_LOADED",
  XmtpSetConversations = "XMTP_SET_CONVERSATIONS",
  XmtpNewConversation = "XMTP_NEW_CONVERSATION",
  XmtpSetAddress = "XMTP_SET_ADDRESS",
  XmtpSetMessages = "XMTP_SET_MESSAGES",
  XmtpLazyMessage = "XMTP_LAZY_MESSAGE",
  XmtpInitialLoad = "XMTP_INITIAL_LOAD",
  XmtpLoading = "XMTP_LOADING",
  XmtpSetCurrentMessageContent = "XMTP_SET_CURRENT_MESSAGE",
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
  [XmtpDispatchTypes.XmtpLazyMessage]: {
    topic: string;
    message: XmtpMessage;
  };
  [XmtpDispatchTypes.XmtpSetCurrentMessageContent]: {
    topic: string;
    content: string;
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
    case XmtpDispatchTypes.XmtpSetCurrentMessageContent: {
      const newState = { ...state };
      newState.conversations[action.payload.topic].currentMessage =
        action.payload.content;
      return newState;
    }
    case XmtpDispatchTypes.XmtpSetConversations: {
      const conversations: {
        [topic: string]: XmtpConversation;
      } = {};

      action.payload.conversations.forEach((c) => {
        conversations[c.topic] = {
          ...c,
          messages:
            c.messages.size > 0
              ? c.messages
              : state.conversations[c.topic]?.messages || new Map(),
          lazyMessages:
            c.lazyMessages.length > 0
              ? c.lazyMessages
              : state.conversations[c.topic]?.lazyMessages || [],
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
            lazyMessages: [],
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

    case XmtpDispatchTypes.XmtpLazyMessage: {
      const newState = {
        ...state,
        lastUpdateAt: new Date().getTime(),
      };
      newState.conversations[action.payload.topic] = newState.conversations[
        action.payload.topic
      ] || {
        messages: new Map(),
        lazyMessages: [],
        topic: action.payload.topic,
      };
      const conversation = newState.conversations[action.payload.topic];
      conversation.lazyMessages.unshift(action.payload.message);
      return newState;
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
        lazyMessages: [],
        topic: action.payload.topic,
      };
      const conversation = newState.conversations[action.payload.topic];
      for (const message of action.payload.messages) {
        const alreadyMessageWithId = conversation.messages.get(message.id);
        if (alreadyMessageWithId) {
          continue;
        }
        const lazyMessageWithContentIndex = conversation.lazyMessages.findIndex(
          (m) => m.content === message.content
        );
        if (lazyMessageWithContentIndex > -1) {
          conversation.lazyMessages.splice(lazyMessageWithContentIndex, 1);
        }
        conversation.messages.set(message.id, message);
      }

      return newState;
    }

    default:
      return state;
  }
};
