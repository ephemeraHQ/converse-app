import { queryOptions, useQuery } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { WalletId as ThirdwebWalletId } from "thirdweb/wallets";
// TODO: move out of ConnectViaWallet
import { config } from "@/config";
import logger from "@/utils/logger";

// Define specific wallet ID constants tied to thirdweb's WalletId type
export const WALLET_ID: Record<string, ThirdwebWalletId> = {
  COINBASE: "com.coinbase.wallet",
  RAINBOW: "me.rainbow",
  METAMASK: "io.metamask",
} as const;

// Define custom schemes for each wallet
export const WALLET_SCHEME = {
  COINBASE: "cbwallet://" as const,
  RAINBOW: "rainbow://" as const,
  METAMASK: "metamask://" as const,
} as const;

// Create a union type of supported wallet IDs
export type ISupportedWalletId = (typeof WALLET_ID)[keyof typeof WALLET_ID];

// Create a union type of supported wallet schemes
export type ISupportedWalletScheme =
  (typeof WALLET_SCHEME)[keyof typeof WALLET_SCHEME];

// Type guard functions for wallet identification
export function isCoinbaseWallet(wallet: ISupportedWallet): boolean {
  return wallet.thirdwebId === WALLET_ID.COINBASE;
}

export function isRainbowWallet(wallet: ISupportedWallet): boolean {
  return wallet.thirdwebId === WALLET_ID.RAINBOW;
}

export function isMetaMaskWallet(wallet: ISupportedWallet): boolean {
  return wallet.thirdwebId === WALLET_ID.METAMASK;
}

export type ISupportedWallet = {
  name: string;
  iconURL: string;
  customScheme: ISupportedWalletScheme;
  thirdwebId: ISupportedWalletId;
  mobileConfig?: {
    callbackURL: string;
  };
};

export const useInstalledWalletsQuery = () => {
  return useQuery(getInstalledWalletsQueryOptions());
};

// List of wallets that the app supports
const SupportedWallets: ISupportedWallet[] = [
  {
    name: "Coinbase Wallet",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/a5ebc364-8f91-4200-fcc6-be81310a0000?projectId=2f05ae7f1116030fde2d36508f472bfb",
    customScheme: WALLET_SCHEME.COINBASE,
    thirdwebId: WALLET_ID.COINBASE,
    mobileConfig: {
      callbackURL: `https://${config.websiteDomain}/coinbase`,
    },
  },
  {
    name: "Rainbow",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/7a33d7f1-3d12-4b5c-f3ee-5cd83cb1b500?projectId=2f05ae7f1116030fde2d36508f472bfb",
    //  LOG  4:12:10 PM | DEBUG : [Navigation] Handling default link
    //  ERROR  Failed to open URI: rainbow://wc?uri=wc%3Adf81e00aa0a3ddce5a6f2cc98ea001e6dd05881ffee9298a988bb84c7575353f%402%3FexpiryTimestamp%3D1739222230%26relay-protocol%3Dirn%26symKey%3Dea9e0d2a494893eb8d85498370525cd1e67ee7d3fde6dad49a207a0599011ded - is the app installed?
    customScheme: WALLET_SCHEME.RAINBOW,
    thirdwebId: WALLET_ID.RAINBOW,
    // Rainbow Mobile does not support tesnets (even Sepolia)
    // https://rainbow.me/en/support/app/testnets
    // supportedChains: [
    //   ethereum,
    //   base,
    //   optimism,
    //   polygon,
    //   arbitrum,
    //   avalanche,
    //   blast,
    //   zora,
    // ],
  },
  {
    name: "MetaMask",
    // walletConnectId:
    //   "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96",
    iconURL:
      "https://explorer-api.walletconnect.com/v3/logo/sm/018b2d52-10e9-4158-1fde-a5d5bac5aa00?projectId=2f05ae7f1116030fde2d36508f472bfb",
    //  Failed to open URI: metamask://wc?uri=wc%3A505bd431b1f198efb41ba50928ae64ed3c7d58c0eb25653a1018136ec8e8fb77%402%3FexpiryTimestamp%3D1739222248%26relay-protocol%3Dirn%26symKey%3D1c6b91862570d0b6b103285d1998eb6cbaeb8d6cebe201340481fbefa0f2d495 - is the app installed?
    customScheme: WALLET_SCHEME.METAMASK,
    thirdwebId: WALLET_ID.METAMASK,
  },
  // {
  //   name: "Phantom",
  //   iconURL:
  //     "https://explorer-api.walletconnect.com/v3/logo/sm/018b2d52-10e9-4158-1fde-a5d5bac5aa00?projectId=2f05ae7f1116030fde2d36508f472bfb",
  //   // customScheme: "phantom://",
  //   customScheme: "https://phantom.app/ul/v1/connect",
  //   thirdwebId: "app.phantom",
  // },
];

function getInstalledWalletsQueryOptions() {
  return queryOptions({
    queryKey: ["installedWallets"],
    queryFn: async () => {
      return getInstalledWallets({ supportedWallets: SupportedWallets });
    },
    staleTime: 0,
  });
}

async function getInstalledWallets(args: {
  supportedWallets: ISupportedWallet[];
}) {
  const { supportedWallets } = args;

  logger.debug(
    `[getInstalledWallets] Checking ${supportedWallets.length} supported wallets`,
  );

  let installedWalletChecks: boolean[] = [];

  try {
    installedWalletChecks = await Promise.all(
      supportedWallets.map(async (wallet) => {
        try {
          logger.debug(
            `[getInstalledWallets] Checking if ${wallet.name} is installed at ${wallet.customScheme}wc`,
          );

          const canOpen = await Linking.canOpenURL(`${wallet.customScheme}wc`);

          logger.debug(
            `[getInstalledWallets] ${wallet.name} is installed: ${canOpen}`,
          );

          return canOpen;
        } catch (error) {
          logger.error(
            `[getInstalledWallets] Error checking if ${wallet.name} is installed: ${error}`,
          );
          return false;
        }
      }),
    );
  } catch (error) {
    logger.error(
      `[getInstalledWallets] Error checking installed wallets: ${error}`,
    );
    installedWalletChecks = [];
  }

  const installedWallets = supportedWallets.filter(
    (_, index) => installedWalletChecks[index],
  );

  logger.debug(
    `[getInstalledWallets] Found ${installedWallets.length} installed wallets: ${installedWallets.map((w) => w.name).join(", ")}`,
  );

  return installedWallets;
}
