import { WalletId } from "thirdweb/wallets";
import { ISocialProfile } from "@/features/social-profiles/social-profiles.api";

// List view types
export type IListShowing = "wallets" | "socials";

// Wallet connection result types
export type IWalletConnectionStatus = "already_on_xmtp" | "success";

export type IWalletConnectionResult = {
  status: IWalletConnectionStatus;
  addressToLink: string;
  walletAccount: any; // TODO: Replace with proper ThirdWeb wallet account type
} & (
  | { status: "already_on_xmtp"; socialProfiles: ISocialProfile[] }
  | { status: "success"; socialData: ISocialProfile[] }
);

// Connect wallet service parameters
export type IConnectWalletParams = {
  walletType: WalletId;
  options?: Record<string, unknown>;
  currentSenderEthereumAddress: string;
  onEthereumAddressDiscovered: (address: string) => void;
  onSocialDataLoaded: (data: ISocialProfile[]) => void;
};

// // Supported wallet type from the installed wallets hook
// export type ISupportedWallet = {
//   name: string;
//   thirdwebId: WalletId;
//   icon?: string;
// };

// Bottom sheet props
export type IConnectWalletBottomSheetProps = {
  isVisible: boolean;
  onClose: () => void;
  onWalletImported: (socialData: ISocialProfile[]) => void;
};
