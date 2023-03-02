import * as React from "react";
import useWalletConnectContext from "./useWalletConnectContext";
export default function useWalletConnect() {
    const { connector } = useWalletConnectContext();
    return React.useMemo(() => {
        if (connector) {
            return connector;
        }
        return Object.freeze({
            connected: false,
        });
    }, [connector]);
}
