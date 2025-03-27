import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { getInboxStates } from "@xmtp/react-native-sdk"
import { ensureXmtpInstallationQueryData } from "@/features/xmtp/xmtp-installations/xmtp-installation.query"
import { IEthereumAddress } from "@/utils/evm/address"

export async function getRecoveryAddressesForInboxIds(args: {
  clientInboxId: IXmtpInboxId
  inboxIds: IXmtpInboxId[]
}) {
  const { clientInboxId, inboxIds } = args

  const installationId = await ensureXmtpInstallationQueryData({
    inboxId: clientInboxId,
  })

  const inboxStates = await getInboxStates(installationId, true, inboxIds)

  return inboxStates
    .filter((inboxState) => inboxState.recoveryIdentity.kind === "ETHEREUM")
    .map((inboxState) => inboxState.recoveryIdentity.identifier) as IEthereumAddress[]
}
