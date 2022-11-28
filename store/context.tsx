import React, { createContext, useReducer, Dispatch } from "react";
import { xmtpReducer, XmtpActions, XmtpType } from "./reducers";

type InitialStateType = {
  xmtp: XmtpType;
};

const initialState = {
  xmtp: { connected: false },
};

const AppContext = createContext<{
  state: InitialStateType;
  dispatch: Dispatch<XmtpActions>;
}>({
  state: initialState,
  dispatch: () => null,
});

const mainReducer = ({ xmtp }: InitialStateType, action: XmtpActions) => ({
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

export { AppProvider, AppContext };
