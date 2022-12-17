import { upsertConversations, upsertMessages } from "../db";
import { Conversation } from "../db/entities/conversation";
import { Message } from "../db/entities/message";
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
  XmtpNewMessage = "XMTP_NEW_MESSAGE",
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
  [XmtpDispatchTypes.XmtpNewMessage]: {
    topic: string;
    message: XmtpMessage;
  };
  [XmtpDispatchTypes.XmtpLoading]: {
    loading: boolean;
  };
  [XmtpDispatchTypes.XmtpInitialLoad]: undefined;
};

export type XmtpActions = ActionMap<XmtpPayload>[keyof ActionMap<XmtpPayload>];

const xmtpMessageToDb = (
  xmtpMessage: XmtpMessage,
  xmtpConversation: XmtpConversation
): Message => ({
  id: xmtpMessage.id,
  senderAddress: xmtpMessage.senderAddress,
  sent: xmtpMessage.sent,
  content: xmtpMessage.content,
  conversationId: xmtpConversation.topic,
});

// const xmtpMessageFromDb = (message: Message): XmtpMessage => ({
//   id: message.id,
//   senderAddress: message.senderAddress,
//   sent: message.sent,
//   content: message.content,
// });

const xmtpConversationToDb = (
  xmtpConversation: XmtpConversation
): Conversation => ({
  topic: xmtpConversation.topic,
  peerAddress: xmtpConversation.peerAddress,
  createdAt: xmtpConversation.createdAt,
  contextConversationId: xmtpConversation.context?.conversationId,
  contextMetadata: xmtpConversation.context?.metadata
    ? JSON.stringify(xmtpConversation.context.metadata)
    : undefined,
});

// const xmtpConversationFromDb = (
//   dbConversation: Conversation
// ): XmtpConversation => {
//   let context = undefined;
//   if (dbConversation.contextConversationId) {
//     context = {
//       conversationId: dbConversation.contextConversationId,
//       metadata: dbConversation.contextMetadata
//         ? JSON.parse(dbConversation?.contextMetadata)
//         : undefined,
//     };
//   }
//   return {
//     topic: dbConversation.topic,
//     peerAddress: dbConversation.peerAddress,
//     createdAt: dbConversation.createdAt,
//     context,
//     messages: dbConversation.messages
//       ? dbConversation.messages.map(xmtpMessageFromDb)
//       : [],
//   };
// };

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
          messages: state.conversations[c.topic]?.messages || [],
        };
      });

      upsertConversations(
        action.payload.conversations.map(xmtpConversationToDb)
      );

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
      upsertConversations([xmtpConversationToDb(action.payload.conversation)]);
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
      upsertMessages(
        action.payload.messages.map((xmtpMessage) =>
          xmtpMessageToDb(xmtpMessage, conversation)
        )
      );
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

    case XmtpDispatchTypes.XmtpNewMessage: {
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
      upsertMessages([xmtpMessageToDb(action.payload.message, conversation)]);
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
