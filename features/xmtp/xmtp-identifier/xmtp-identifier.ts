import { PublicIdentity } from "@xmtp/react-native-sdk"
import { IEthereumAddress } from "@/utils/evm/address"

export type IEthereumIdentity = PublicIdentity & {
  kind: "ETHEREUM"
  identifier: IEthereumAddress
}

export function xmtpIdentityIsEthereumAddress(
  identity: PublicIdentity,
): identity is IEthereumIdentity {
  return identity.kind === "ETHEREUM"
}
