import { InboxId } from "@xmtp/react-native-sdk"
import { IEthereumAddress } from "@/utils/evm/address"
import { getXmtpClientByInboxId } from "../xmtp-client/xmtp-client.service"

export async function getEthAddressesFromInboxIds(args: {
  clientInboxId: InboxId
  inboxIds: InboxId[]
}) {
  const { clientInboxId, inboxIds } = args

  const client = await getXmtpClientByInboxId({
    inboxId: clientInboxId,
  })

  const inboxStates = await client.inboxStates(true, inboxIds)

  return inboxStates
    .map((inboxState) => inboxState.identities.filter((identity) => identity.kind === "ETHEREUM"))
    .flat()
    .map((identity) => identity.identifier as IEthereumAddress)
}
