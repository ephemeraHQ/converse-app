import { ISmartWalletClient } from "@/features/wallets/smart-wallet"
import { IXmtpSigner } from "@/features/xmtp/xmtp.types"

export function createXmtpSignerFromSwc(smartWalletClient: ISmartWalletClient): IXmtpSigner {
  return {
    getAddress: async () => smartWalletClient.account.address,
    getChainId: () => smartWalletClient.chain?.id,
    getBlockNumber: () => undefined,
    walletType: () => "SCW",
    signMessage: async (message: string) => smartWalletClient.signMessage({ message }),
  }
}
