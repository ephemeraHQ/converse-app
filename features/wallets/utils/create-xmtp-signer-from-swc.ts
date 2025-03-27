import { PublicIdentity } from "@xmtp/react-native-sdk"
import { ISmartWalletClient } from "@/features/wallets/smart-wallet"
import { IXmtpSigner } from "@/features/xmtp/xmtp.types"

export function createXmtpSignerFromSwc(smartWalletClient: ISmartWalletClient): IXmtpSigner {
  return {
    getIdentifier: async () => new PublicIdentity(smartWalletClient.account.address, "ETHEREUM"),
    getChainId: () => smartWalletClient.chain?.id,
    getBlockNumber: () => undefined,
    signerType: () => "SCW",
    signMessage: async (message: string) => {
      const signature = await smartWalletClient.signMessage({ message })
      return {
        signature,
      }
    },
  }
}
