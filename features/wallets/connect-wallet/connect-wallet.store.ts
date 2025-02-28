import { WalletId } from "thirdweb/wallets";
import { create } from "zustand";
import { ISocialProfile } from "@/features/social-profiles/social-profiles.api";
import { IListShowing } from "./connect-wallet.types";

type IConnectWalletState = {
  // Base state
  thirdwebWalletIdThatIsConnecting: WalletId | undefined;
  ethereumAddressThatIsConnecting: string | undefined;
  socialData: ISocialProfile[] | undefined;
  listShowing: IListShowing;
  pagesHeight: Record<number, number>; // page index -> height
};

type IConnectWalletDerivedState = {
  isShowingWalletList: boolean;
  isWalletListDisabled: boolean;
  isShowingSocialIdentityList: boolean;
  isShowingNoSocialsMessage: boolean;
};

type IConnectWalletActions = {
  setConnectingWallet: (walletId: WalletId) => void;
  setConnectingEthereumAddress: (ethereumAddress: string) => void;
  setSocialData: (data: ISocialProfile[]) => void;
  reset: () => void;
};

type IConnectWalletStore = IConnectWalletState &
  IConnectWalletDerivedState & {
    actions: IConnectWalletActions;
  };

const initialState: IConnectWalletState = {
  thirdwebWalletIdThatIsConnecting: undefined,
  ethereumAddressThatIsConnecting: undefined,
  socialData: undefined,
  listShowing: "wallets",
  pagesHeight: {},
};

/**
 * Store for managing wallet connection state
 */
export const useConnectWalletStore = create<IConnectWalletStore>(
  (set, get) => ({
    // Initial state
    ...initialState,

    // Derived states as computed properties
    get isShowingWalletList() {
      return get().listShowing === "wallets";
    },
    get isWalletListDisabled() {
      return get().thirdwebWalletIdThatIsConnecting !== undefined;
    },
    get isShowingSocialIdentityList() {
      return get().listShowing === "socials" && get().socialData !== undefined;
    },
    get isShowingNoSocialsMessage() {
      return get().listShowing === "socials" && get().socialData === undefined;
    },

    actions: {
      // Actions
      setConnectingWallet: (walletId: WalletId) =>
        set({
          thirdwebWalletIdThatIsConnecting: walletId,
          ethereumAddressThatIsConnecting: undefined,
          socialData: undefined,
        }),

      setConnectingEthereumAddress: (ethereumAddress: string) =>
        set({ ethereumAddressThatIsConnecting: ethereumAddress }),

      setSocialData: (data: ISocialProfile[]) =>
        set({
          socialData: data,
          thirdwebWalletIdThatIsConnecting: undefined,
          listShowing: "socials",
        }),

      reset: () => set(initialState),
    },
  }),
);
