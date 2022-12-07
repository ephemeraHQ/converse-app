import React, { createContext, Dispatch, useReducer } from "react";

import {
  XmtpActions,
  xmtpInitialState,
  xmtpReducer,
  XmtpType,
} from "./reducers";

type StateType = {
  xmtp: XmtpType;
};

const initialState: StateType = {
  xmtp: xmtpInitialState,
};

const AppContext = createContext<{
  state: StateType;
  dispatch: Dispatch<XmtpActions>;
}>({
  state: initialState,
  dispatch: () => null,
});

const mainReducer = ({ xmtp }: StateType, action: XmtpActions) => ({
  xmtp: xmtpReducer(xmtp, action),
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
