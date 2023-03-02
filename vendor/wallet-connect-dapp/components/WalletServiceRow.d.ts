import { WalletService } from "../types";
export declare type WalletServiceRowProps = {
  readonly style?: unknown;
  readonly walletServices: readonly WalletService[];
  readonly width: number;
  readonly height: number;
  readonly division: number;
  readonly connectToWalletService: (walletService: WalletService) => unknown;
};
export default function WalletServiceRow({
  style,
  width,
  height,
  walletServices,
  division,
  connectToWalletService,
}: WalletServiceRowProps): JSX.Element;
