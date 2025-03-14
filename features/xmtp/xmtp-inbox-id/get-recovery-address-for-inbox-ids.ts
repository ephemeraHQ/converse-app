import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { IEthereumAddress } from "@/utils/evm/address"
import { getXmtpClientByEthAddress } from "../xmtp-client/xmtp-client.service"

export async function getRecoveryAddressesForInboxIds(args: {
  clientEthAddress: IEthereumAddress
  inboxIds: IXmtpInboxId[]
}) {
  const { clientEthAddress, inboxIds } = args

  const client = await getXmtpClientByEthAddress({
    ethAddress: clientEthAddress,
  })

  const inboxStates = await client.inboxStates(true, inboxIds)

  return inboxStates
    .filter((inboxState) => inboxState.recoveryIdentity.kind === "ETHEREUM")
    .map((inboxState) => inboxState.recoveryIdentity.identifier) as IEthereumAddress[]
}
