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
    [peerAddress: string]: XmtpConversation;
  };
  address?: string;
};

export const xmtpInitialState: XmtpType = {
  connected: false,
  webviewLoaded: false,
  conversationsLoaded: false,
  conversations: {},
  address: undefined,
};

export type XmtpMessage = {
  id: string;
  senderAddress: string;
  sent: number;
  content: string;
};

export enum DispatchTypes {
  XmtpConnected = "XMTP_CONNECTED",
  XmtpWebviewLoaded = "XMTP_WEBVIEW_LOADED",
  XmtpSetConversations = "XMTP_SET_CONVERSATIONS",
  XmtpSetAddress = "XMTP_SET_ADDRESS",
  XmtpSetMessages = "XMTP_SET_MESSAGES",
  XmtpNewMessage = "XMTP_NEW_MESSAGE",
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
  [DispatchTypes.XmtpSetAddress]: {
    address: string;
  };
  [DispatchTypes.XmtpSetMessages]: {
    peerAddress: string;
    messages: XmtpMessage[];
  };
  [DispatchTypes.XmtpNewMessage]: {
    peerAddress: string;
    message: XmtpMessage;
  };
};

export type XmtpActions = ActionMap<XmtpPayload>[keyof ActionMap<XmtpPayload>];

export const xmtpReducer = (state: XmtpType, action: XmtpActions) => {
  switch (action.type) {
    case DispatchTypes.XmtpSetAddress:
      return {
        ...state,
        address: action.payload.address,
      };
    case DispatchTypes.XmtpConnected:
      if (!action.payload.connected) {
        return xmtpInitialState;
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
        [key: string]: XmtpConversation;
      } = {};
      action.payload.conversations.forEach((c) => {
        conversations[c.peerAddress] = { ...c, messages: [] };
      });
      return {
        ...state,
        conversationsLoaded: true,
        conversations,
      };
    }

    case DispatchTypes.XmtpSetMessages: {
      const conversation = state.conversations[action.payload.peerAddress];
      if (!conversation) return state;
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [action.payload.peerAddress]: {
            ...state.conversations[action.payload.peerAddress],
            messages: action.payload.messages,
          },
        },
      };
    }

    case DispatchTypes.XmtpNewMessage: {
      if (!state.conversations[action.payload.peerAddress]) return;

      const newState = {
        ...state,
      };
      const conversation = newState.conversations[action.payload.peerAddress];
      const alreadyMessage = conversation.messages.find(
        (m) => m.id === action.payload.message.id
      );
      if (!alreadyMessage) {
        conversation.messages.unshift(action.payload.message);
      }
      return newState;
    }

    default:
      return state;
  }
};
