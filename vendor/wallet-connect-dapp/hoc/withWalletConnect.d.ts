import * as React from "react";
import { WalletConnectProviderProps } from "../types";
declare const withWalletConnectThunk: (
  Component: React.ElementType,
  options: Partial<WalletConnectProviderProps>
) => React.ElementType;
export default withWalletConnectThunk;
