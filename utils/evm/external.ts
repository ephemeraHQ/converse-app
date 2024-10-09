import { converseEventEmitter, waitForConverseEvent } from "@utils/events";
import logger from "@utils/logger";
import { thirdwebClient } from "@utils/thirdweb";
import { Signer } from "ethers";
import { useCallback, useMemo, useRef } from "react";
import { prepareTransaction, sendAndConfirmTransaction } from "thirdweb";
import { ethers5Adapter } from "thirdweb/adapters/ethers5";
import { base, Chain, ethereum, sepolia } from "thirdweb/chains";
import {
  useActiveAccount,
  useActiveWallet,
  useAutoConnect,
  useDisconnect,
  useSetActiveWallet,
  useSwitchActiveWalletChain,
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
  const switchActiveWalletChain = useSwitchActiveWalletChain();

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

  const supportedChains = useMemo(() => {
    const byId: { [chainId: number]: Chain } = {};
    [ethereum, sepolia, base].forEach((chain) => {
      byId[chain.id] = chain;
    });
    return byId;
  }, []);

  const switchChain = useCallback(
    (chainId: number) => {
      if (!supportedChains[chainId])
        throw new Error(`Chain ${chainId} is not supported`);
      return switchActiveWalletChain(supportedChains[chainId]);
    },
    [supportedChains, switchActiveWalletChain]
  );

  const sendTx = useCallback(
    async ({
      to,
      data,
      value,
    }: {
      to: string;
      data: string | undefined;
      value: string | undefined;
    }) => {
      if (!activeAccount || !activeWallet) {
        throw new Error("No current active account");
      }
      const chain = await activeWallet.getChain();
      if (!chain) {
        throw new Error("Wallet does not seem connected to a chain");
      }

      logger.info(
        `[TxFrame] Sending transaction to ${to} with value ${value} on chain ${
          chain.name || chain.id
        }`
      );

      const transaction = prepareTransaction({
        to,
        value: value ? BigInt(value) : undefined,
        chain,
        client: thirdwebClient,
        data:
          data && data.startsWith("0x") ? (data as `0x${string}`) : undefined,
      });

      return sendAndConfirmTransaction({
        account: activeAccount,
        transaction,
      });
    },
    [activeAccount, activeWallet]
  );

  return {
    getExternalSigner,
    resetExternalSigner,
    switchChain,
    sendTransaction: sendTx,
  };
};

export const useAutoConnectExternalWallet = () => {
  // Keep access to last
  // thirdweb external wallet
  useAutoConnect({
    client: thirdwebClient,
  });
};
