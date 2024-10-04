import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import { WalletId } from "thirdweb/wallets";

import { isDesktop } from "../../utils/device";
import { isEthOS } from "../../utils/ethos";

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

export type InstalledWallet = {
  name: string;
  iconURL: string;
  customScheme?: string;
  universalLink?: string;
  walletConnectId?: string;
  platforms?: string[];
  thirdwebId?: WalletId;
};

const SUPPORTED_WALLETS: InstalledWallet[] = [
  {
    name: "Coinbase Wallet",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/a5ebc364-8f91-4200-fcc6-be81310a0000?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "cbwallet://",
    thirdwebId: "com.coinbase.wallet",
  },
  {
    name: "Ledger Live",
    walletConnectId:
      "19177a98252e07ddfc9af2083ba8e07ef627cb6103467ffebb3f8f4205fd7927",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/a7f416de-aa03-4c5e-3280-ab49269aef00?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "ledgerlive://",
    thirdwebId: "com.ledger",
  },
  {
    name: "Rainbow",
    walletConnectId:
      "1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/7a33d7f1-3d12-4b5c-f3ee-5cd83cb1b500?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "rainbow://",
    thirdwebId: "me.rainbow",
  },
  {
    name: "MetaMask",
    walletConnectId:
      "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/018b2d52-10e9-4158-1fde-a5d5bac5aa00?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "metamask://",
    thirdwebId: "io.metamask",
  },
  {
    name: "Trust Wallet",
    walletConnectId:
      "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/0528ee7e-16d1-4089-21e3-bbfb41933100?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "trust://",
    thirdwebId: "com.trustwallet.app",
  },
  {
    name: "Uniswap Wallet",
    walletConnectId:
      "c03dfee351b6fcc421b4494ea33b9d4b92a984f87aa76d1663bb28705e95034a",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/bff9cf1f-df19-42ce-f62a-87f04df13c00?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "uniswap://",
    thirdwebId: "org.uniswap",
  },
  {
    name: "Zerion",
    walletConnectId:
      "ecc4036f814562b41a5268adc86270fba1365471402006302e70169465b7ac18",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/73f6f52f-7862-49e7-bb85-ba93ab72cc00?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "zerion://",
    thirdwebId: "io.zerion.wallet",
  },
  {
    name: "Exodus",
    walletConnectId:
      "e9ff15be73584489ca4a66f64d32c4537711797e30b6660dbcb71ea72a42b1f4",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/4c16cad4-cac9-4643-6726-c696efaf5200?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "exodus://",
    universalLink: "https://exodus.com/m",
    thirdwebId: "com.exodus",
  },
  // {
  //   name: "1inch Wallet",
  //   walletConnectId:
  //     "c286eebc742a537cd1d6818363e9dc53b21759a1e8e5d9b263d0c03ec7703576",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/52b1da3c-9e72-40ae-5dac-6142addd9c00?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "oneinch://",
  //   universalLink: "https://wallet.1inch.io",
  // },
];

let hasCheckedInstalled = false;
export let installedWallets: typeof SUPPORTED_WALLETS = [];

export const getInstalledWallets = async (
  refresh: boolean
): Promise<InstalledWallet[]> => {
  if ((hasCheckedInstalled && !refresh) || isDesktop) return installedWallets;
  const checkInstalled = await Promise.all(
    SUPPORTED_WALLETS.map((w) => Linking.canOpenURL(`${w.customScheme}wc`))
  );
  const wallets: typeof SUPPORTED_WALLETS = [];

  const ethOS = await isEthOS();
  if (ethOS) {
    wallets.push({
      name: "EthOS Wallet",
      iconURL: "https://converse.xyz/ethos.png",
    });
  }

  wallets.push(...SUPPORTED_WALLETS.filter((w, i) => checkInstalled[i]));
  installedWallets = wallets;
  hasCheckedInstalled = true;
  return installedWallets;
};

export const useInstalledWallets = () => {
  const [wallets, setWallets] = useState(installedWallets);
  useEffect(() => {
    getInstalledWallets(true).then(setWallets);
  }, []);
  return wallets;
};
