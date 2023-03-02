import { WalletService } from "../types";
declare type State = {
  readonly data: readonly WalletService[];
  readonly error?: Error;
  readonly loading: boolean;
};
export default function useMobileRegistry(): State;
export {};
