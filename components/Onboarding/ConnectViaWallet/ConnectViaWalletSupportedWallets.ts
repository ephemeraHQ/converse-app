// TODO: move out of ConnectViaWallet
import * as Linking from "expo-linking";
import { useCallback, useEffect, useState } from "react";
import { Chain } from "thirdweb";
import {
  arbitrum,
  avalanche,
  base,
  blast,
  ethereum,
  optimism,
  polygon,
  zora,
} from "thirdweb/chains";
import { WalletId } from "thirdweb/wallets";

import { useAppStateHandlers } from "../../../hooks/useAppStateHandlers";
import { isEthOS } from "../../../utils/ethos";
import { InstalledWallet, SUPPORTED_WALLETS } from "@utils/evm/wallets";

export const POPULAR_WALLETS = [
  {
    name: "Rainbow",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/7a33d7f1-3d12-4b5c-f3ee-5cd83cb1b500?projectId=2f05ae7f1116030fde2d36508f472bfb",
    url: "https://rnbwapp.com",
  },
  {
    name: "Ledger Live",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/a7f416de-aa03-4c5e-3280-ab49269aef00?projectId=2f05ae7f1116030fde2d36508f472bfb",
    url: "https://www.ledger.com/ledger-live",
  },
  {
    name: "Coinbase Wallet",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/a5ebc364-8f91-4200-fcc6-be81310a0000?projectId=2f05ae7f1116030fde2d36508f472bfb",
    url: "https://www.coinbase.com/wallet/",
  },
  {
    name: "MetaMask",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/5195e9db-94d8-4579-6f11-ef553be95100?projectId=2f05ae7f1116030fde2d36508f472bfb",
    url: "https://metamask.app.link",
  },
  {
    name: "Trust Wallet",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/0528ee7e-16d1-4089-21e3-bbfb41933100?projectId=2f05ae7f1116030fde2d36508f472bfb",
    url: "https://trustwallet.com/",
  },
  {
    name: "Zerion",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/73f6f52f-7862-49e7-bb85-ba93ab72cc00?projectId=2f05ae7f1116030fde2d36508f472bfb",
    url: "https://wallet.zerion.io",
  },
];

let hasCheckedInstalled = false;
export let installedWallets: InstalledWallet[] = [];

export const getInstalledWallets = async (
  refresh: boolean
): Promise<InstalledWallet[]> => {
  if (hasCheckedInstalled && !refresh) return installedWallets;
  const checkInstalled = await Promise.all(
    Object.values(SUPPORTED_WALLETS).map(
      (w) => !!w.customScheme && Linking.canOpenURL(`${w.customScheme}wc`)
    )
  );
  const wallets: InstalledWallet[] = [];

  const ethOS = await isEthOS();
  if (ethOS) {
    wallets.push({
      name: "EthOS Wallet",
      iconURL: "https://converse.xyz/ethos.png",
    });
  }

  wallets.push(
    ...(Object.values(SUPPORTED_WALLETS) as InstalledWallet[]).filter(
      (w, i) => checkInstalled[i] || w.isSmartContractWallet
    )
  );
  installedWallets = wallets;
  hasCheckedInstalled = true;
  return installedWallets;
};

export const useInstalledWallets = () => {
  const [walletsInstalled, setWalletsInstalled] =
    useState<InstalledWallet[]>(installedWallets);

  const loadInstalledWallets = useCallback(async (refresh: boolean) => {
    const list = await getInstalledWallets(refresh);
    setWalletsInstalled(list);
  }, []);

  useAppStateHandlers({
    deps: [loadInstalledWallets],
    onForeground: () => {
      loadInstalledWallets(true);
    },
  });

  useEffect(() => {
    loadInstalledWallets(false);
  }, [loadInstalledWallets]);

  return walletsInstalled;
};
