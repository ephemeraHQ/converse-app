import { WalletId } from "thirdweb/wallets"
import { create } from "zustand"
import { IWallet } from "./connect-wallet.types"

// type IPage = "choose-app" | "choose-name" | "link-inbox" | "rotate-inbox"

type IConnectWalletState = {
  thirdwebWalletIdThatIsConnecting: WalletId | undefined
  activeWallet: IWallet | undefined
  selectedInfo: { name: string; avatar: string | undefined } | undefined
  // page: IPage
}

type IConnectWalletActions = {
  setWalletIdThatIsConnecting: (walletId: WalletId | undefined) => void
  setActiveWallet: (wallet: IWallet | undefined) => void
  setSelectedInfo: (info: { name: string; avatar: string | undefined } | undefined) => void
  reset: () => void
  // setPage: (page: IPage) => void
}

type IConnectWalletStore = IConnectWalletState & {
  actions: IConnectWalletActions
}

const initialState: IConnectWalletState = {
  // page: "choose-app",
  thirdwebWalletIdThatIsConnecting: undefined,
  activeWallet: undefined,
  selectedInfo: undefined,
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
      }),

    setActiveWallet: (wallet) => set({ activeWallet: wallet }),

    setSelectedInfo: (info) => set({ selectedInfo: info }),

    reset: () => set(initialState),

    // setPage: (page) => set({ page }),
  },
}))
