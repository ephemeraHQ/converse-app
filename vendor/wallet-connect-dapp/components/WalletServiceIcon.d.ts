import { WalletService } from "../types";
export declare type WalletServiceIconProps = {
  readonly width: number;
  readonly height: number;
  readonly walletService: WalletService;
  readonly connectToWalletService: (walletService: WalletService) => unknown;
  readonly size?: "sm" | "md" | "lg";
};
export default function WalletServiceIcon({
  width,
  height,
  walletService,
  connectToWalletService,
  size,
}: WalletServiceIconProps): JSX.Element;
