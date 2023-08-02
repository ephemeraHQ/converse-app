import React, { createContext, Dispatch, useReducer } from "react";

import { AppActions, appInitialState, appReducer, AppType } from "./appReducer";
import {
  RecommendationsActions,
  recommendationsInitialState,
  recommendationsReducer,
  RecommendationsType,
} from "./recommendationsReducer";
import {
  XmtpActions,
  xmtpInitialState,
  xmtpReducer,
  XmtpType,
} from "./xmtpReducer";

export type StateType = {
  xmtp: XmtpType;
  app: AppType;
  recommendations: RecommendationsType;
};

const initialState: StateType = {
  xmtp: xmtpInitialState,
  app: appInitialState,
  recommendations: recommendationsInitialState,
};

export type ActionsType = XmtpActions | AppActions | RecommendationsActions;
export type DispatchType = (value: ActionsType) => void;

const AppContext = createContext<{
  state: StateType;
  dispatch: Dispatch<ActionsType>;
}>({
  state: initialState,
  dispatch: () => null,
});

const mainReducer = (
  { xmtp, app, recommendations }: StateType,
  action: ActionsType
) => ({
  app: appReducer(app, action as AppActions),
  xmtp: xmtpReducer(xmtp, action as XmtpActions),
  recommendations: recommendationsReducer(
    recommendations,
    action as RecommendationsActions
  ),
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
