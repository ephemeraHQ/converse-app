import { useSmartWallets } from "@privy-io/expo/smart-wallets"

export type ISmartWalletClient = NonNullable<ReturnType<typeof useSmartWallets>["client"]>

export function useSmartWalletClient() {
  const { client: smartWalletClient } = useSmartWallets()

  return {
    smartWalletClient,
  }
}
