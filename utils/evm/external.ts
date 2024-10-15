import { converseEventEmitter, waitForConverseEvent } from "@utils/events";
import logger from "@utils/logger";
import { thirdwebClient } from "@utils/thirdweb";
import { Signer } from "ethers";
import { useCallback, useEffect, useMemo } from "react";
import { prepareTransaction, sendTransaction } from "thirdweb";
import { ethers5Adapter } from "thirdweb/adapters/ethers5";
import { base, Chain, ethereum, sepolia } from "thirdweb/chains";
import {
  useActiveAccount,
  useActiveWallet,
  useActiveWalletChain,
  useAutoConnect,
  useDisconnect,
  useSetActiveWallet,
  useSwitchActiveWalletChain,
} from "thirdweb/react";
import { Account } from "thirdweb/wallets";

let signerSingleton: Signer | undefined = undefined;
let accountSingleton: Account | undefined = undefined;

/**
 * External wallet signer (i.e. not Privy)
 * for XMTP signatures or tx frames
 */
export const useExternalSigner = () => {
  const setActiveWallet = useSetActiveWallet();
  const chain = useActiveWalletChain();
  const activeAccount = useActiveAccount();
  const activeWallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const switchActiveWalletChain = useSwitchActiveWalletChain();

  useEffect(() => {
    accountSingleton = activeAccount;
  }, [activeAccount]);

  const getExternalSigner = useCallback(
    async (title?: string, subtitle?: string) => {
      if (signerSingleton) {
        return signerSingleton;
      }
      if (accountSingleton) {
        const signer = await ethers5Adapter.signer.toEthers({
          client: thirdwebClient,
          chain: ethereum,
          account: accountSingleton,
        });
        signerSingleton = signer;

        return signer;
      }
      converseEventEmitter.emit("displayExternalWalletPicker", title, subtitle);
      const [{ wallet, account }] = await waitForConverseEvent(
        "externalWalletPicked"
      );
      if (!wallet || !account) return;
      setActiveWallet(wallet);
      const signer = await ethers5Adapter.signer.toEthers({
        client: thirdwebClient,
        chain: ethereum,
        account,
      });
      signerSingleton = signer;

      return signer;
    },
    [setActiveWallet]
  );

  const resetExternalSigner = useCallback(() => {
    try {
      activeWallet?.disconnect();
      if (activeWallet) {
        disconnect(activeWallet);
      }
    } catch (e) {
      logger.warn(e);
    }
    signerSingleton = undefined;
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
      to?: string;
      data?: string | undefined;
      value?: string | undefined;
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

      return sendTransaction({
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
    address: activeAccount?.address,
    walletAppId: activeWallet?.id,
    chainId: chain?.id,
  };
};

export const useAutoConnectExternalWallet = () => {
  // Keep access to last
  // thirdweb external wallet
  useAutoConnect({
    client: thirdwebClient,
  });
};
