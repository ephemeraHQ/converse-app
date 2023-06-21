import * as Linking from "expo-linking";

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
    url: "https://trustology.io/",
  },
  {
    name: "Zerion",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/f216b371-96cf-409a-9d88-296392b85800?projectId=2f05ae7f1116030fde2d36508f472bfb",
    url: "https://wallet.zerion.io",
  },
];

export type InstalledWallet = {
  name: string;
  iconURL: string;
  customScheme: string;
  universalLink?: string;
  isMetaMask?: boolean;
  isCoinbase?: boolean;
  walletConnectId?: string;
  decodeWalletConnectURI?: boolean;
};

const SUPPORTED_WALLETS: InstalledWallet[] = [
  {
    name: "Coinbase Wallet",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/a5ebc364-8f91-4200-fcc6-be81310a0000?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "cbwallet://",
    isCoinbase: true,
  },
  // {
  //   name: "Ledger Live",
  //   walletConnectId:
  //     "19177a98252e07ddfc9af2083ba8e07ef627cb6103467ffebb3f8f4205fd7927",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/a7f416de-aa03-4c5e-3280-ab49269aef00?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "ledgerlive://",
  // },
  {
    name: "Rainbow",
    walletConnectId:
      "1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/7a33d7f1-3d12-4b5c-f3ee-5cd83cb1b500?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "rainbow://",
  },
  {
    name: "MetaMask",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/5195e9db-94d8-4579-6f11-ef553be95100?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "metamask://",
    isMetaMask: true,
  },
  {
    name: "Trust Wallet",
    walletConnectId:
      "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/0528ee7e-16d1-4089-21e3-bbfb41933100?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "trust://",
  },
  {
    name: "Uniswap Wallet",
    walletConnectId:
      "c03dfee351b6fcc421b4494ea33b9d4b92a984f87aa76d1663bb28705e95034a",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/bff9cf1f-df19-42ce-f62a-87f04df13c00?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "uniswap://",
  },
  {
    name: "Zerion",
    walletConnectId:
      "ecc4036f814562b41a5268adc86270fba1365471402006302e70169465b7ac18",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/f216b371-96cf-409a-9d88-296392b85800?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "zerion://",
  },
  {
    name: "imToken",
    walletConnectId:
      "ef333840daf915aafdc4a004525502d6d49d77bd9c65e0642dbaefb3c2893bef",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/99520548-525c-49d7-fb2f-5db65293b000?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "imtokenv2://",
    decodeWalletConnectURI: true,
  },
  {
    name: "MEW wallet",
    walletConnectId:
      "f5b4eeb6015d66be3f5940a895cbaa49ef3439e518cd771270e6b553b48f31d2",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/e2024511-2c9b-46d7-3111-52df3d241700?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "mewwallet://",
  },
  {
    name: "Exodus",
    walletConnectId:
      "e9ff15be73584489ca4a66f64d32c4537711797e30b6660dbcb71ea72a42b1f4",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/4c16cad4-cac9-4643-6726-c696efaf5200?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "exodus://",
    universalLink: "https://exodus.com/m",
  },
  // {
  //   name: "1inch Wallet",
  //   walletConnectId:
  //     "c286eebc742a537cd1d6818363e9dc53b21759a1e8e5d9b263d0c03ec7703576",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/52b1da3c-9e72-40ae-5dac-6142addd9c00?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   customScheme: "oneinch://",
  //   universalLink: "https://wallet.1inch.io",
  //   decodeWalletConnectURI: true,
  // },
];

let hasCheckedInstalled = false;
let installedWallets: typeof SUPPORTED_WALLETS = [];

export const getInstalledWallets = async (
  refresh: boolean
): Promise<InstalledWallet[]> => {
  if (hasCheckedInstalled && !refresh) return installedWallets;
  const checkInstalled = await Promise.all(
    SUPPORTED_WALLETS.map((w) => Linking.canOpenURL(w.customScheme))
  );
  installedWallets = SUPPORTED_WALLETS.filter((w, i) => checkInstalled[i]);
  hasCheckedInstalled = true;
  return installedWallets;
};
