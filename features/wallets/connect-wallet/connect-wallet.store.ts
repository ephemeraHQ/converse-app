import { WalletId } from "thirdweb/wallets"
import { create } from "zustand"
import { IWallet } from "./connect-wallet.types"

type IConnectWalletState = {
  // Connection state
  thirdwebWalletIdThatIsConnecting: WalletId | undefined
  ethereumAddressThatIsConnecting: string | undefined
  activeWallet: IWallet | undefined
  isConnecting: boolean
  error: Error | null

  // UI state
  pagesHeight: Record<number, number> // page index -> height
}

type IConnectWalletActions = {
  // Connection actions
  setThirdwebWalletIdThatIsConnecting: (walletId: WalletId | undefined) => void
  setEthereumAddressThatIsConnecting: (ethereumAddress: string) => void
  setActiveWallet: (wallet: IWallet | undefined) => void
  setIsConnecting: (isConnecting: boolean) => void
  setError: (error: Error | null) => void

  // Reset action
  reset: () => void
}

type IConnectWalletStore = IConnectWalletState & {
  actions: IConnectWalletActions
}

const initialState: IConnectWalletState = {
  thirdwebWalletIdThatIsConnecting: undefined,
  ethereumAddressThatIsConnecting: undefined,
  activeWallet: undefined,
  isConnecting: false,
  error: null,
  pagesHeight: {},
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
    setThirdwebWalletIdThatIsConnecting: (walletId) =>
      set({
        thirdwebWalletIdThatIsConnecting: walletId,
        ethereumAddressThatIsConnecting: undefined,
      }),

    setEthereumAddressThatIsConnecting: (ethereumAddress: string) =>
      set({ ethereumAddressThatIsConnecting: ethereumAddress }),

    setActiveWallet: (wallet) => set({ activeWallet: wallet }),

    setIsConnecting: (isConnecting) => set({ isConnecting }),

    setError: (error) => set({ error }),

    // Reset action
    reset: () => set(initialState),
  },
}))
