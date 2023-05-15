import { ActionMap } from "./types";

// Product

export type AppType = {
  splashScreenHidden: boolean;
  mainIdentity: string;
  isInternetReachable: boolean;
  hydrationDone: boolean;
};

export const appInitialState: AppType = {
  splashScreenHidden: false,
  mainIdentity: "",
  isInternetReachable: false,
  hydrationDone: false,
};

export enum AppDispatchTypes {
  AppHideSplashscreen = "APP_HIDE_SPLASHSCREEN",
  AppSetMainIdentity = "APP_SET_MAIN_IDENTITY",
  AppSetInternetReachable = "APP_SET_INTERNET_REACHABLE",
  AppSetHydrationDone = "APP_SET_HYDRATION_DONE",
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

    default:
      return state;
  }
};
