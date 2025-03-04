import { WalletId } from "thirdweb/wallets"
import { create } from "zustand"
import { IWallet } from "./connect-wallet.types"

type IPage = "choose-app" | "choose-name" | "link-inbox" | "rotate-inbox"

type IConnectWalletState = {
  // Connection state
  page: IPage
  thirdwebWalletIdThatIsConnecting: WalletId | undefined
  ethereumAddressThatIsConnecting: string | undefined
  activeWallet: IWallet | undefined
}

type IConnectWalletActions = {
  // Connection actions
  setWalletIdThatIsConnecting: (walletId: WalletId | undefined) => void
  setEthereumAddressThatIsConnecting: (ethereumAddress: string) => void
  setActiveWallet: (wallet: IWallet | undefined) => void
  setPage: (page: IPage) => void
  // Reset action
  reset: () => void
}

type IConnectWalletStore = IConnectWalletState & {
  actions: IConnectWalletActions
}

const initialState: IConnectWalletState = {
  page: "choose-app",
  thirdwebWalletIdThatIsConnecting: undefined,
  ethereumAddressThatIsConnecting: undefined,
  activeWallet: undefined,
}

/**
 * Store for managing wallet connection state
 *
 * This store centralizes all wallet connection state and actions,
 * reducing the need for prop drilling and hooks in individual components.
 */
export const useConnectWalletStore = create<IConnectWalletStore>((set) => ({
  // Initial state
  ...initialState,

  actions: {
    // Connection actions
    setWalletIdThatIsConnecting: (walletId) =>
      set({
        thirdwebWalletIdThatIsConnecting: walletId,
        ethereumAddressThatIsConnecting: undefined,
      }),

    setEthereumAddressThatIsConnecting: (ethereumAddress: string) =>
      set({ ethereumAddressThatIsConnecting: ethereumAddress }),

    setActiveWallet: (wallet) => set({ activeWallet: wallet }),

    setPage: (page) => set({ page }),

    // Reset action
    reset: () => set(initialState),
  },
}))
