// TODO: move out of ConnectViaWallet
import {
  arbitrum,
  avalanche,
  base,
  blast,
  ethereum,
  optimism,
  polygon,
  zora,
  sepolia,
  bsc,
  fantom,
  gnosis,
  celo,
  zkSync,
  polygonZkEvm,
  linea,
  scroll,
  mantaPacific,
  xai,
  Chain,
} from "thirdweb/chains";
import { WalletId } from "thirdweb/wallets";

export const DEFAULT_SUPPORTED_CHAINS = [
  ethereum,
  base,
  optimism,
  polygon,
  arbitrum,
  avalanche,
  blast,
  zora,
  sepolia,
  bsc,
  fantom,
  gnosis,
  celo,
  zkSync,
  polygonZkEvm,
  linea,
  scroll,
  mantaPacific,
  xai,
];

export const CHAIN_BY_ID = DEFAULT_SUPPORTED_CHAINS.reduce(
  (acc, chain) => {
    acc[chain.id] = chain;
    return acc;
  },
  {} as Record<number, (typeof DEFAULT_SUPPORTED_CHAINS)[number]>
);
const _SUPPORTED_WALLETS = {
  // Keep this one first to enable auto-connect without conflict with Coinbase Wallet
  "Coinbase Smart Wallet": {
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/a5ebc364-8f91-4200-fcc6-be81310a0000?projectId=2f05ae7f1116030fde2d36508f472bfb",
    thirdwebId: "com.coinbase.wallet",
    isSmartContractWallet: true,
  },
  "Coinbase Wallet": {
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/a5ebc364-8f91-4200-fcc6-be81310a0000?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "cbwallet://",
    thirdwebId: "com.coinbase.wallet",
  },
  "Ledger Live": {
    walletConnectId:
      "19177a98252e07ddfc9af2083ba8e07ef627cb6103467ffebb3f8f4205fd7927",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/a7f416de-aa03-4c5e-3280-ab49269aef00?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "ledgerlive://",
    thirdwebId: "com.ledger",
  },
  Rainbow: {
    walletConnectId:
      "1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/7a33d7f1-3d12-4b5c-f3ee-5cd83cb1b500?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "rainbow://",
    thirdwebId: "me.rainbow",
    // Rainbow Mobile does not support tesnets (even Sepolia)
    // https://rainbow.me/en/support/app/testnets
    supportedChains: [
      ethereum,
      base,
      optimism,
      polygon,
      arbitrum,
      avalanche,
      blast,
      zora,
    ],
  },
  MetaMask: {
    walletConnectId:
      "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/018b2d52-10e9-4158-1fde-a5d5bac5aa00?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "metamask://",
    thirdwebId: "io.metamask",
  },
  "Trust Wallet": {
    walletConnectId:
      "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/0528ee7e-16d1-4089-21e3-bbfb41933100?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "trust://",
    thirdwebId: "com.trustwallet.app",
  },
  "Uniswap Wallet": {
    walletConnectId:
      "c03dfee351b6fcc421b4494ea33b9d4b92a984f87aa76d1663bb28705e95034a",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/bff9cf1f-df19-42ce-f62a-87f04df13c00?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "uniswap://",
    thirdwebId: "org.uniswap",
  },
  Zerion: {
    walletConnectId:
      "ecc4036f814562b41a5268adc86270fba1365471402006302e70169465b7ac18",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/73f6f52f-7862-49e7-bb85-ba93ab72cc00?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "zerion://",
    thirdwebId: "io.zerion.wallet",
  },
  Exodus: {
    walletConnectId:
      "e9ff15be73584489ca4a66f64d32c4537711797e30b6660dbcb71ea72a42b1f4",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/4c16cad4-cac9-4643-6726-c696efaf5200?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: "exodus://",
    universalLink: "https://exodus.com/m",
    thirdwebId: "com.exodus",
  },
};

export type ISupportedWalletName =
  | keyof typeof _SUPPORTED_WALLETS
  | "EthOS Wallet";

export const SUPPORTED_WALLETS = Object.fromEntries(
  Object.entries(_SUPPORTED_WALLETS).map(([name, config]) => [
    name,
    {
      name,
      ...config,
    },
  ])
) as Record<ISupportedWalletName, InstalledWallet>;

export type InstalledWallet = {
  name: string;
  iconURL: string;
  customScheme?: string;
  universalLink?: string;
  walletConnectId?: string;
  platforms?: string[];
  thirdwebId?: WalletId;
  isSmartContractWallet?: boolean;
  supportedChains?: Chain[];
};
