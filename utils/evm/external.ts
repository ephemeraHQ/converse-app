import logger from "@utils/logger";
import { thirdwebClient } from "@utils/thirdweb";
import { Signer } from "ethers";
import { useCallback, useRef } from "react";
import { ethers5Adapter } from "thirdweb/adapters/ethers5";
import { ethereum } from "thirdweb/chains";
import {
  useActiveAccount,
  useActiveWallet,
  useDisconnect,
  useSetActiveWallet,
} from "thirdweb/react";
import { Account, createWallet, Wallet } from "thirdweb/wallets";

import config from "../../config";

export const useExternalSigner = () => {
  const thirdwebSigner = useRef<Signer | undefined>();
  const thirdwebWallet = useRef<Wallet | undefined>();
  const setActiveWallet = useSetActiveWallet();
  const activeAccount = useActiveAccount();
  const activeWallet = useActiveWallet();
  const { disconnect } = useDisconnect();

  const getExternalSigner = useCallback(async () => {
    if (thirdwebSigner.current) return thirdwebSigner.current;
    if (activeAccount) {
      thirdwebSigner.current = await ethers5Adapter.signer.toEthers({
        client: thirdwebClient,
        chain: ethereum,
        account: activeAccount,
      });
      return thirdwebSigner.current;
    }
    const coinbaseWallet = createWallet("com.coinbase.wallet", {
      appMetadata: config.walletConnectConfig.appMetadata,
      mobileConfig: {
        callbackURL: `https://${config.websiteDomain}/coinbase`,
      },
    });
    // Let's first try to autoconnect
    let account: Account | undefined = undefined;
    try {
      account = await coinbaseWallet.autoConnect({ client: thirdwebClient });
    } catch {
      account = await coinbaseWallet.connect({ client: thirdwebClient });
    }
    setActiveWallet(coinbaseWallet);
    thirdwebSigner.current = await ethers5Adapter.signer.toEthers({
      client: thirdwebClient,
      chain: ethereum,
      account,
    });
    thirdwebWallet.current = coinbaseWallet;
    return thirdwebSigner.current;
  }, [activeAccount, setActiveWallet]);

  const resetExternalSigner = useCallback(() => {
    try {
      if (activeWallet) {
        disconnect(activeWallet);
      }
      thirdwebWallet.current?.disconnect();
    } catch (e) {
      logger.warn(e);
    }
    thirdwebWallet.current = undefined;
    thirdwebSigner.current = undefined;
  }, [activeWallet, disconnect]);

  return { getExternalSigner, resetExternalSigner };
};
