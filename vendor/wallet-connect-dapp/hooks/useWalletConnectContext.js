import * as React from "react";
import { WalletConnectContext } from "../contexts";
export default function useWalletConnectContext() {
    return React.useContext(WalletConnectContext);
}
