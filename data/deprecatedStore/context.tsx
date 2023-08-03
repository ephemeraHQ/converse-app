import React, { createContext, Dispatch, useReducer } from "react";

import {
  XmtpActions,
  xmtpInitialState,
  xmtpReducer,
  XmtpType,
} from "./xmtpReducer";

export type StateType = {
  xmtp: XmtpType;
};

const initialState: StateType = {
  xmtp: xmtpInitialState,
};

export type ActionsType = XmtpActions;
export type DispatchType = (value: ActionsType) => void;

const AppContext = createContext<{
  state: StateType;
  dispatch: Dispatch<ActionsType>;
}>({
  state: initialState,
  dispatch: () => null,
});

const mainReducer = ({ xmtp, app }: StateType, action: ActionsType) => ({
  xmtp: xmtpReducer(xmtp, action as XmtpActions),
});

const AppProvider: React.FC<any> = (props: any) => {
  const [state, dispatch] = useReducer(mainReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {props.children}
    </AppContext.Provider>
  );
};

export { AppContext, AppProvider };
