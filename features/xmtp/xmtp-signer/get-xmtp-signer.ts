import { PublicIdentity } from "@xmtp/react-native-sdk"
import { IXmtpSigner } from "../xmtp.types"

export function getXmtpSigner(args: {
  ethAddress: string
  type: "EOA" | "SCW"
  chainId: number
  signMessage: (message: string) => Promise<string>
}): IXmtpSigner {
  return {
    getIdentifier: async () => {
      return new PublicIdentity(args.ethAddress, "ETHEREUM")
    },
    getChainId: () => args.chainId,
    getBlockNumber: () => undefined,
    signerType: () => args.type,
    signMessage: async (message: string) => {
      const signature = await args.signMessage(message)
      return {
        signature,
      }
    },
  }
}
