import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, Dispatch, useEffect, useReducer } from "react";

import { AppActions, appInitialState, appReducer, AppType } from "./appReducer";
import {
  NotificationsActions,
  NotificationsDispatchTypes,
  notificationsInitialState,
  notificationsReducer,
  NotificationsType,
} from "./notificationsReducer";
import {
  XmtpActions,
  xmtpInitialState,
  xmtpReducer,
  XmtpType,
} from "./xmtpReducer";

export type StateType = {
  xmtp: XmtpType;
  notifications: NotificationsType;
  app: AppType;
};

const initialState: StateType = {
  xmtp: xmtpInitialState,
  notifications: notificationsInitialState,
  app: appInitialState,
};

export type ActionsType = XmtpActions | NotificationsActions | AppActions;
export type DispatchType = (value: ActionsType) => void;

const AppContext = createContext<{
  state: StateType;
  dispatch: Dispatch<ActionsType>;
}>({
  state: initialState,
  dispatch: () => null,
});

const mainReducer = (
  { xmtp, notifications, app }: StateType,
  action: ActionsType
) => ({
  app: appReducer(app, action as AppActions),
  xmtp: xmtpReducer(xmtp, action as XmtpActions),
  notifications: notificationsReducer(
    notifications,
    action as NotificationsActions
  ),
});

const AppProvider: React.FC<any> = (props: any) => {
  const [state, dispatch] = useReducer(mainReducer, initialState);

  // Rehydrating persisted state

  useEffect(() => {
    AsyncStorage.getItem("state.notifications.showNotificationsScreen").then(
      (value: string | null) => {
        if (value) {
          dispatch({
            type: NotificationsDispatchTypes.NotificationsShowScreen,
            payload: {
              show: value !== "0",
            },
          });
        }
      }
    );
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {props.children}
    </AppContext.Provider>
  );
};

export { AppContext, AppProvider };
