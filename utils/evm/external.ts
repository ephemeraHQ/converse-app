import { useInstalledWallets } from "@components/Onboarding/ConnectViaWallet/ConnectViaWalletSupportedWallets";
import { translate } from "@i18n";
import { converseEventEmitter, waitForConverseEvent } from "@utils/events";
import logger from "@utils/logger";
import { thirdwebClient } from "@utils/thirdweb";
import { Signer } from "ethers";
import { useCallback, useEffect, useMemo } from "react";
import { Alert } from "react-native";
import { prepareTransaction, sendTransaction } from "thirdweb";
import { ethers5Adapter } from "thirdweb/adapters/ethers5";
import { Chain, ethereum } from "thirdweb/chains";
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
import { DEFAULT_SUPPORTED_CHAINS } from "./wallets";

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
  const wallets = useInstalledWallets();

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

  const resetExternalSigner = useCallback(async () => {
    try {
      await activeWallet?.disconnect();
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
    const activeWalletId = activeWallet?.id;
    let chains = DEFAULT_SUPPORTED_CHAINS;
    if (activeWalletId) {
      const wallet = wallets.find((w) => w.thirdwebId === activeWalletId);
      if (wallet?.supportedChains) {
        chains = wallet.supportedChains;
      }
    }
    chains.forEach((chain) => {
      byId[chain.id] = chain;
    });
    return byId;
  }, [activeWallet?.id, wallets]);

  const switchChain = useCallback(
    async (chainId: number) => {
      if (!supportedChains[chainId]) {
        Alert.alert(translate("external_wallet_chain_not_supported"));
        return;
      }
      return switchActiveWalletChain(supportedChains[chainId]);
    },
    [supportedChains, switchActiveWalletChain]
  );

  const sendTx = useCallback(
    async ({
      to,
      data,
      value,
      chainId,
    }: {
      to?: string;
      data?: string | undefined;
      value?: string | undefined;
      chainId?: number | undefined;
    }) => {
      if (!activeAccount || !activeWallet) {
        throw new Error("No current active account");
      }
      let chain: Chain | undefined = undefined;
      if (chainId) {
        chain = supportedChains[chainId];
        if (!chain) {
          throw new Error(`Chain ${chainId} is not supported`);
        }
      } else {
        chain = await activeWallet.getChain();
        if (!chain) {
          throw new Error("Wallet does not seem connected to a chain");
        }
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
    [activeAccount, activeWallet, supportedChains]
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
