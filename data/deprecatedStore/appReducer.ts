import { ActionMap } from "./types";

// Product

export type AppType = {
  mediaPreview: {
    sending: boolean;
    mediaURI?: string;
    error: boolean;
  };
  openAttachmentForMessage: string | null;
};

export const appInitialState: AppType = {
  mediaPreview: {
    sending: false,
    mediaURI: undefined,
    error: false,
  },
  openAttachmentForMessage: null,
};

export enum AppDispatchTypes {
  AppSetMediaPreview = "APP_SET_MEDIA_PREVIEW",
  AppOpenAttachmentForMessage = "APP_OPEN_ATTACHMENT_FOR_MESSAGE",
}

type AppPayload = {
  [AppDispatchTypes.AppSetMediaPreview]: {
    sending: boolean;
    mediaURI?: string;
    error: boolean;
  };
  [AppDispatchTypes.AppOpenAttachmentForMessage]: {
    messageId: string | null;
  };
};

export type AppActions = ActionMap<AppPayload>[keyof ActionMap<AppPayload>];

export const appReducer = (state: AppType, action: AppActions): AppType => {
  switch (action.type) {
    case AppDispatchTypes.AppSetMediaPreview: {
      return {
        ...state,
        mediaPreview: action.payload,
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
