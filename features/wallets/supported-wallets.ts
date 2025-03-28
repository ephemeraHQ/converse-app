import { Platform } from "react-native"
import { WalletId as ThirdwebWalletId } from "thirdweb/wallets"
import { coinbaseCallbackUrl } from "@/features/wallets/utils/coinbase-wallet"

// Define specific wallet ID constants tied to thirdweb's WalletId type
export const WALLET_ID: Record<string, ThirdwebWalletId> = {
  COINBASE: "com.coinbase.wallet",
  RAINBOW: "me.rainbow",
  METAMASK: "io.metamask",
} as const

// Define custom schemes for each wallet
export const WALLET_SCHEME = {
  COINBASE: "cbwallet://" as const,
  RAINBOW: "rainbow://" as const,
  METAMASK: "metamask://" as const,
} as const

// Create a union type of supported wallet IDs
export type ISupportedWalletId = (typeof WALLET_ID)[keyof typeof WALLET_ID]

// Create a union type of supported wallet schemes
export type ISupportedWalletScheme = (typeof WALLET_SCHEME)[keyof typeof WALLET_SCHEME]

export type ISupportedWallet = {
  name: string
  imageLocalUri: number
  customScheme: ISupportedWalletScheme
  thirdwebId: ISupportedWalletId
  storeUrl: string
  mobileConfig?: {
    callbackURL: string
  }
}

// Type guard functions for wallet identification
export function isCoinbaseWallet(wallet: ISupportedWallet): boolean {
  return wallet.thirdwebId === WALLET_ID.COINBASE
}

export function isRainbowWallet(wallet: ISupportedWallet): boolean {
  return wallet.thirdwebId === WALLET_ID.RAINBOW
}

export function isMetaMaskWallet(wallet: ISupportedWallet): boolean {
  return wallet.thirdwebId === WALLET_ID.METAMASK
}

// List of wallets that the app supports
export const supportedWallets: ISupportedWallet[] = [
  {
    name: "Coinbase Wallet",
    imageLocalUri: require("@assets/images/web3/coinbase-wallet.png"),
    customScheme: WALLET_SCHEME.COINBASE,
    thirdwebId: WALLET_ID.COINBASE,
    storeUrl:
      Platform.OS === "ios"
        ? "https://apps.apple.com/us/app/coinbase-wallet-nfts-crypto/id1278383455"
        : "https://play.google.com/store/apps/details?id=org.toshi",
    mobileConfig: {
      callbackURL: coinbaseCallbackUrl.toString(),
    },
  },
  {
    name: "Rainbow",
    imageLocalUri: require("@assets/images/web3/rainbow.png"),
    customScheme: WALLET_SCHEME.RAINBOW,
    thirdwebId: WALLET_ID.RAINBOW,
    storeUrl:
      Platform.OS === "ios"
        ? "https://apps.apple.com/us/app/rainbow-ethereum-wallet/id1457119021"
        : "https://play.google.com/store/apps/details?id=com.rainbow",
    // Rainbow Mobile does not support tesnets (even Sepolia)
    // https://rainbow.me/en/support/app/testnets
  },
  {
    name: "MetaMask",
    imageLocalUri: require("@assets/images/web3/metamask.png"),
    customScheme: WALLET_SCHEME.METAMASK,
    thirdwebId: WALLET_ID.METAMASK,
    storeUrl:
      Platform.OS === "ios"
        ? "https://apps.apple.com/ca/app/metamask-blockchain-wallet/id1438144202"
        : "https://play.google.com/store/apps/details?id=io.metamask",
  },
]
