import WalletConnect from "@walletconnect/client";
export declare type useWalletConnectResult = {
  readonly connector?: WalletConnect;
  readonly connected: boolean;
};
export default function useWalletConnect(): WalletConnect;
