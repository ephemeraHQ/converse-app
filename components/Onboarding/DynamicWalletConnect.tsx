import { useConnect } from "@thirdweb-dev/react-core";
import {
  WCMeta,
  WalletConnectV2,
  WalletOptions,
  WalletConfig,
  WC2Options,
} from "@thirdweb-dev/react-native";
import { useCallback } from "react";

import config from "../../config";

class DynamicWalletConnect extends WalletConnectV2 {
  readonly id: string;

  readonly meta: WCMeta;

  constructor(id: string, meta: WCMeta, options: WC2Options) {
    super(options);
    this.id = id;
    this.meta = meta;
  }

  getMeta(): WCMeta {
    return this.meta;
  }
}

const dynamicWalletConnect = (
  id: string,
  meta: WCMeta
): WalletConfig<WalletConnectV2> => {
  return {
    id,
    meta,
    create: (options: WalletOptions) =>
      new DynamicWalletConnect(id, meta, {
        ...options,
        walletId: id,
        projectId: config.walletConnectConfig.projectId,
      }),
  };
};

export function useDynamicWalletConnect() {
  const connect = useConnect();
  return useCallback(
    (id: string, meta: WCMeta, connectOptions?: { chainId?: number }) =>
      connect(dynamicWalletConnect(id, meta), connectOptions),
    [connect]
  );
}
