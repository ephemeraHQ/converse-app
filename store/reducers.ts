type ActionMap<M extends { [index: string]: any }> = {
  [Key in keyof M]: M[Key] extends undefined
    ? {
        type: Key;
      }
    : {
        type: Key;
        payload: M[Key];
      };
};

export enum DispatchTypes {
  XmtpConnected = "XMTP_CONNECTED",
}

// Product

export type XmtpType = {
  connected: boolean;
};

type XmtpPayload = {
  [DispatchTypes.XmtpConnected]: {
    connected: boolean;
  };
};

export type XmtpActions = ActionMap<XmtpPayload>[keyof ActionMap<XmtpPayload>];

export const xmtpReducer = (state: XmtpType, action: XmtpActions) => {
  switch (action.type) {
    case DispatchTypes.XmtpConnected:
      return {
        ...state,
        connected: action.payload.connected,
      };
    default:
      return state;
  }
};
