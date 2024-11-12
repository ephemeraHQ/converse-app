import { useInstalledWallets } from "@components/Onboarding/ConnectViaWallet/ConnectViaWalletSupportedWallets";
import { translate } from "@i18n";
import logger from "@utils/logger";
import { sentryTrackError } from "@utils/sentry";
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
import { Account, createWallet } from "thirdweb/wallets";
import { useExternalWalletPickerContext } from "../../features/ExternalWalletPicker/ExternalWalletPicker.context";
import { DEFAULT_SUPPORTED_CHAINS } from "./wallets";
import config from "../../config";

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
  const { openAndWaitForWalletPicked } = useExternalWalletPickerContext();

  useEffect(() => {
    accountSingleton = activeAccount;
  }, [activeAccount]);

  const getExternalSigner = useCallback(
    async (title?: string, subtitle?: string) => {
      try {
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
        const { wallet, account } = await openAndWaitForWalletPicked();
        setActiveWallet(wallet);
        const signer = await ethers5Adapter.signer.toEthers({
          client: thirdwebClient,
          chain: ethereum,
          account,
        });
        signerSingleton = signer;

        return signer;
      } catch (error) {
        sentryTrackError(error);
      }
    },
    [setActiveWallet, openAndWaitForWalletPicked]
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
    // The Coinbase wallet callbackURL needs to be set
    // here also for autoconnect to work
    wallets: [
      createWallet("com.coinbase.wallet", {
        appMetadata: config.walletConnectConfig.appMetadata,
        mobileConfig: {
          callbackURL: `https://${config.websiteDomain}/coinbase`,
        },
      }),
    ],
  });
};
