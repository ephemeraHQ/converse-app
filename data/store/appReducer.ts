import { ActionMap } from "./types";

// Product

export type AppType = {
  splashScreenHidden: boolean;
  mainIdentity: string;
  isInternetReachable: boolean;
  hydrationDone: boolean;
  desktopConnectSessionId?: string;
  mediaPreview: {
    sending: boolean;
    mediaURI?: string;
    error: boolean;
  };
};

export const appInitialState: AppType = {
  splashScreenHidden: false,
  mainIdentity: "",
  isInternetReachable: false,
  hydrationDone: false,
  desktopConnectSessionId: undefined,
  mediaPreview: {
    sending: false,
    mediaURI: undefined,
    error: false,
  },
};

export enum AppDispatchTypes {
  AppHideSplashscreen = "APP_HIDE_SPLASHSCREEN",
  AppSetMainIdentity = "APP_SET_MAIN_IDENTITY",
  AppSetInternetReachable = "APP_SET_INTERNET_REACHABLE",
  AppSetHydrationDone = "APP_SET_HYDRATION_DONE",
  AppSetDesktopConnectSessionId = "APP_SET_DESKTOP_SESSION_ID",
  AppSetMediaPreview = "APP_SET_MEDIA_PREVIEW",
}

type AppPayload = {
  [AppDispatchTypes.AppHideSplashscreen]: {
    hide: boolean;
  };
  [AppDispatchTypes.AppSetMainIdentity]: {
    identity: string;
  };
  [AppDispatchTypes.AppSetInternetReachable]: {
    reachable: boolean;
  };
  [AppDispatchTypes.AppSetHydrationDone]: {
    done: boolean;
  };
  [AppDispatchTypes.AppSetDesktopConnectSessionId]: {
    sessionId?: string;
  };
  [AppDispatchTypes.AppSetMediaPreview]: {
    sending: boolean;
    mediaURI?: string;
    error: boolean;
  };
};

export type AppActions = ActionMap<AppPayload>[keyof ActionMap<AppPayload>];

export const appReducer = (state: AppType, action: AppActions): AppType => {
  switch (action.type) {
    case AppDispatchTypes.AppHideSplashscreen: {
      return {
        ...state,
        splashScreenHidden: action.payload.hide,
      };
    }
    case AppDispatchTypes.AppSetMainIdentity: {
      return {
        ...state,
        mainIdentity: action.payload.identity,
      };
    }

    case AppDispatchTypes.AppSetInternetReachable: {
      return {
        ...state,
        isInternetReachable: action.payload.reachable,
      };
    }

    case AppDispatchTypes.AppSetHydrationDone: {
      return {
        ...state,
        hydrationDone: action.payload.done,
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

    default:
      return state;
  }
};
