import { ActionMap } from "./types";

// Product

export type AppType = {
  openAttachmentForMessage: string | null;
};

export const appInitialState: AppType = {
  openAttachmentForMessage: null,
};

export enum AppDispatchTypes {
  AppOpenAttachmentForMessage = "APP_OPEN_ATTACHMENT_FOR_MESSAGE",
}

type AppPayload = {
  [AppDispatchTypes.AppOpenAttachmentForMessage]: {
    messageId: string | null;
  };
};

export type AppActions = ActionMap<AppPayload>[keyof ActionMap<AppPayload>];

export const appReducer = (state: AppType, action: AppActions): AppType => {
  switch (action.type) {
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
