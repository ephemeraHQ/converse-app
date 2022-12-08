type ActionMap<M extends { [index: string]: any }> = {
  [Key in keyof M]: M[Key] extends undefined
    ? {
        type: Key;
      }
    : {
        type: Key;
        payload: M[Key];
      };
};

// Product

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
  conversationsLoaded: boolean;
  conversations: {
    [topic: string]: XmtpConversation;
  };
  lastUpdateAt: number;
  address?: string;
};

export const xmtpInitialState: XmtpType = {
  connected: false,
  webviewLoaded: false,
  conversationsLoaded: false,
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

export enum DispatchTypes {
  XmtpConnected = "XMTP_CONNECTED",
  XmtpWebviewLoaded = "XMTP_WEBVIEW_LOADED",
  XmtpSetConversations = "XMTP_SET_CONVERSATIONS",
  XmtpNewConversation = "XMTP_NEW_CONVERSATION",
  XmtpSetAddress = "XMTP_SET_ADDRESS",
  XmtpSetMessages = "XMTP_SET_MESSAGES",
  XmtpNewMessage = "XMTP_NEW_MESSAGE",
  XmtpInitialLoad = "XMTP_INITIAL_LOAD",
}

type XmtpPayload = {
  [DispatchTypes.XmtpConnected]: {
    connected: boolean;
  };
  [DispatchTypes.XmtpWebviewLoaded]: {
    loaded: boolean;
  };
  [DispatchTypes.XmtpSetConversations]: {
    conversations: XmtpConversation[];
  };
  [DispatchTypes.XmtpNewConversation]: {
    conversation: XmtpConversation;
  };
  [DispatchTypes.XmtpSetAddress]: {
    address: string;
  };
  [DispatchTypes.XmtpSetMessages]: {
    topic: string;
    messages: XmtpMessage[];
  };
  [DispatchTypes.XmtpNewMessage]: {
    topic: string;
    message: XmtpMessage;
  };
  [DispatchTypes.XmtpInitialLoad]: undefined;
};

export type XmtpActions = ActionMap<XmtpPayload>[keyof ActionMap<XmtpPayload>];

export const xmtpReducer = (state: XmtpType, action: XmtpActions): XmtpType => {
  switch (action.type) {
    case DispatchTypes.XmtpSetAddress:
      return {
        ...state,
        address: action.payload.address,
      };
    case DispatchTypes.XmtpConnected:
      if (!action.payload.connected) {
        return { ...xmtpInitialState, webviewLoaded: state.webviewLoaded };
      }
      return {
        ...state,
        connected: action.payload.connected,
      };
    case DispatchTypes.XmtpWebviewLoaded:
      return {
        ...state,
        webviewLoaded: action.payload.loaded,
      };
    case DispatchTypes.XmtpSetConversations: {
      const conversations: {
        [topic: string]: XmtpConversation;
      } = {};

      action.payload.conversations.forEach((c) => {
        conversations[c.topic] = {
          ...c,
          messages: state.conversations[c.topic]?.messages || [],
        };
      });
      return {
        ...state,
        lastUpdateAt: new Date().getTime(),
        conversations,
      };
    }
    case DispatchTypes.XmtpNewConversation: {
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
    case DispatchTypes.XmtpInitialLoad: {
      return {
        ...state,
        conversationsLoaded: true,
      };
    }

    case DispatchTypes.XmtpSetMessages: {
      const conversation = state.conversations[action.payload.topic];
      if (!conversation) return state;
      return {
        ...state,
        lastUpdateAt: new Date().getTime(),
        conversations: {
          ...state.conversations,
          [action.payload.topic]: {
            ...state.conversations[action.payload.topic],
            messages: action.payload.messages,
          },
        },
      };
    }

    case DispatchTypes.XmtpNewMessage: {
      if (!state.conversations[action.payload.topic]) return state;

      const newState = {
        ...state,
        lastUpdateAt: new Date().getTime(),
      };
      const conversation = newState.conversations[action.payload.topic];
      const alreadyMessageWithId = conversation.messages.find(
        (m) => m.id === action.payload.message.id
      );
      if (alreadyMessageWithId) return newState;
      const lazyMessageWithContentIndex = conversation.messages.findIndex(
        (m) => m.content === action.payload.message.content && m.lazy
      );
      if (lazyMessageWithContentIndex > -1) {
        conversation.messages.splice(lazyMessageWithContentIndex, 1);
      }
      conversation.messages.unshift(action.payload.message);
      return newState;
    }

    default:
      return state;
  }
};
