import { InboxId } from "@xmtp/react-native-sdk"
import { IEthereumAddress } from "@/utils/evm/address"
import { getXmtpClientByEthAddress } from "../xmtp-client/xmtp-client.service"

export async function getRecoveryAddressesForInboxIds(args: {
  clientEthAddress: IEthereumAddress
  inboxIds: InboxId[]
}) {
  const { clientEthAddress, inboxIds } = args

  const client = await getXmtpClientByEthAddress({
    ethAddress: clientEthAddress,
  })

  const inboxStates = await client.inboxStates(true, inboxIds)

  return inboxStates
    .filter((inboxState) => inboxState.recoveryIdentity.kind === "ETHEREUM")
    .map((inboxState) => inboxState.recoveryIdentity.identifier)
}
