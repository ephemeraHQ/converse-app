import { useSmartWallets } from "@privy-io/expo/smart-wallets"
import { IXmtpSigner } from "@/features/xmtp/xmtp.types"

export function createXmtpSignerFromPrivySwc(
  smartWalletClient: NonNullable<ReturnType<typeof useSmartWallets>["client"]>,
): IXmtpSigner {
  return {
    getAddress: async () => smartWalletClient.account.address,
    getChainId: () => smartWalletClient.chain?.id,
    getBlockNumber: () => undefined,
    walletType: () => "SCW",
    signMessage: async (message: string) => smartWalletClient.signMessage({ message }),
  }
}
