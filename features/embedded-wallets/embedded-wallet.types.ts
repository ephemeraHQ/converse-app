import { usePrivy } from "@privy-io/expo";
import { useSmartWallets } from "@privy-io/expo/smart-wallets";

export type PrivySmartWalletClient = NonNullable<
  ReturnType<typeof useSmartWallets>["client"]
>;
export type PrivyUser = NonNullable<ReturnType<typeof usePrivy>["user"]>;
