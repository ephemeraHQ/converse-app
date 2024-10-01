import { converseEventEmitter, waitForConverseEvent } from "@utils/events";
import logger from "@utils/logger";
import { thirdwebClient } from "@utils/thirdweb";
import { Signer } from "ethers";
import { useCallback, useRef } from "react";
import { ethers5Adapter } from "thirdweb/adapters/ethers5";
import { ethereum } from "thirdweb/chains";
import {
  useActiveAccount,
  useActiveWallet,
  useAutoConnect,
  useDisconnect,
  useSetActiveWallet,
} from "thirdweb/react";
import { Wallet } from "thirdweb/wallets";

/**
 * External wallet signer (i.e. not Privy)
 * for XMTP signatures or tx frames
 */
export const useExternalSigner = () => {
  const thirdwebSigner = useRef<Signer | undefined>();
  const thirdwebWallet = useRef<Wallet | undefined>();
  const setActiveWallet = useSetActiveWallet();
  const activeAccount = useActiveAccount();
  const activeWallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  useAutoConnect({
    client: thirdwebClient,
  });

  const getExternalSigner = useCallback(
    async (title?: string, subtitle?: string) => {
      if (thirdwebSigner.current) return thirdwebSigner.current;
      if (activeAccount) {
        thirdwebSigner.current = await ethers5Adapter.signer.toEthers({
          client: thirdwebClient,
          chain: ethereum,
          account: activeAccount,
        });
        return thirdwebSigner.current;
      }
      converseEventEmitter.emit("displayExternalWalletPicker", title, subtitle);
      const [{ wallet, account }] = await waitForConverseEvent(
        "externalWalletPicked"
      );
      if (!wallet || !account) return;
      setActiveWallet(wallet);
      thirdwebSigner.current = await ethers5Adapter.signer.toEthers({
        client: thirdwebClient,
        chain: ethereum,
        account,
      });
      thirdwebWallet.current = wallet;
      return thirdwebSigner.current;
    },
    [activeAccount, setActiveWallet]
  );

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
