import { ActionMap } from "./types";

// Product

export type AppType = {
  splashScreenHidden: boolean;
  mainIdentity: string;
  isDemoAccount: boolean;
};

export const appInitialState: AppType = {
  splashScreenHidden: false,
  mainIdentity: "",
  isDemoAccount: false,
};

export enum AppDispatchTypes {
  AppHideSplashscreen = "APP_HIDE_SPLASHSCREEN",
  AppSetMainIdentity = "APP_SET_MAIN_IDENTITY",
  AppSetDemoAccount = "APP_SET_DEMO_ACCOUNT",
}

type AppPayload = {
  [AppDispatchTypes.AppHideSplashscreen]: {
    hide: boolean;
  };
  [AppDispatchTypes.AppSetMainIdentity]: {
    identity: string;
  };
  [AppDispatchTypes.AppSetDemoAccount]: {
    isDemoAccount: boolean;
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

    case AppDispatchTypes.AppSetDemoAccount: {
      return {
        ...state,
        isDemoAccount: action.payload.isDemoAccount,
      };
    }

    default:
      return state;
  }
};
