import { ActionMap } from "./types";

// Product

export type AppType = {
  splashScreenHidden: boolean;
  mainIdentity: string;
};

export const appInitialState: AppType = {
  splashScreenHidden: false,
  mainIdentity: "",
};

export enum AppDispatchTypes {
  AppHideSplashscreen = "APP_HIDE_SPLASHSCREEN",
  AppSetMainIdentity = "APP_SET_MAIN_IDENTITY",
}

type AppPayload = {
  [AppDispatchTypes.AppHideSplashscreen]: {
    hide: boolean;
  };
  [AppDispatchTypes.AppSetMainIdentity]: {
    identity: string;
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

    default:
      return state;
  }
};
