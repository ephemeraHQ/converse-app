import { ActionMap } from "./types";

// Product

export type AppType = {
  isInternetReachable: boolean;
  desktopConnectSessionId?: string;
  mediaPreview: {
    sending: boolean;
    mediaURI?: string;
    error: boolean;
  };
  openAttachmentForMessage: string | null;
  ephemeralAccount: boolean;
};

export const appInitialState: AppType = {
  isInternetReachable: false,
  desktopConnectSessionId: undefined,
  mediaPreview: {
    sending: false,
    mediaURI: undefined,
    error: false,
  },
  ephemeralAccount: false,
  openAttachmentForMessage: null,
};

export enum AppDispatchTypes {
  AppSetDesktopConnectSessionId = "APP_SET_DESKTOP_SESSION_ID",
  AppSetMediaPreview = "APP_SET_MEDIA_PREVIEW",
  AppSetEphemeralAccount = "APP_SET_EPHEMERAL_ACCOUNT",
  AppOpenAttachmentForMessage = "APP_OPEN_ATTACHMENT_FOR_MESSAGE",
}

type AppPayload = {
  [AppDispatchTypes.AppSetDesktopConnectSessionId]: {
    sessionId?: string;
  };
  [AppDispatchTypes.AppSetMediaPreview]: {
    sending: boolean;
    mediaURI?: string;
    error: boolean;
  };
  [AppDispatchTypes.AppSetEphemeralAccount]: {
    ephemeral: boolean;
  };
  [AppDispatchTypes.AppOpenAttachmentForMessage]: {
    messageId: string | null;
  };
};

export type AppActions = ActionMap<AppPayload>[keyof ActionMap<AppPayload>];

export const appReducer = (state: AppType, action: AppActions): AppType => {
  switch (action.type) {
    case AppDispatchTypes.AppSetEphemeralAccount: {
      return {
        ...state,
        ephemeralAccount: action.payload.ephemeral,
      };
    }

    case AppDispatchTypes.AppSetMediaPreview: {
      return {
        ...state,
        mediaPreview: action.payload,
      };
    }

    case AppDispatchTypes.AppSetDesktopConnectSessionId: {
      return {
        ...state,
        desktopConnectSessionId: action.payload.sessionId,
      };
    }

    case AppDispatchTypes.AppOpenAttachmentForMessage: {
      return {
        ...state,
        openAttachmentForMessage: action.payload.messageId,
      };
    }

    default:
      return state;
  }
};
