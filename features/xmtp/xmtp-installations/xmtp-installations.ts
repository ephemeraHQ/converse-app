import { getInboxState } from "@xmtp/react-native-sdk"
import { ensureXmtpInstallationQueryData } from "@/features/xmtp/xmtp-installations/xmtp-installation.query"
import { IXmtpClientWithCodecs, IXmtpInboxId, IXmtpSigner } from "@/features/xmtp/xmtp.types"
import { translate } from "@/i18n"
import { awaitableAlert } from "@/utils/alert"
import logger from "@/utils/logger"

export async function getOtherInstallations(args: { client: IXmtpClientWithCodecs }) {
  const { client } = args

  const inboxState = await client.inboxState(true)
  const installationIds = inboxState.installations.map((i) => i.id)

  const otherInstallations = installationIds.filter((id) => id !== client.installationId)

  return otherInstallations
}

export async function validateXmtpInstallation(args: { inboxId: IXmtpInboxId }) {
  const { inboxId } = args
  const installationId = await ensureXmtpInstallationQueryData({ inboxId })
  const inboxState = await getInboxState(installationId, true)
  const installationsIds = inboxState.installations.map((i) => i.id)
  return installationsIds.includes(installationId)
}

export async function revokeOtherInstallations(args: {
  signer: IXmtpSigner
  client: IXmtpClientWithCodecs
  otherInstallationsCount: number
}) {
  const { client, otherInstallationsCount } = args

  if (otherInstallationsCount === 0) return false
  logger.warn(`Inbox ${client.inboxId} has ${otherInstallationsCount} installations to revoke`)
  // We're on a mobile wallet so we need to ask the user first
  const doRevoke = await awaitableAlert(
    translate("other_installations_count", {
      count: otherInstallationsCount,
    }),
    translate("revoke_description"),
    "Yes",
    "No",
  )
  if (!doRevoke) {
    logger.debug(`[Onboarding] User decided not to revoke`)
    return false
  }
  logger.debug(`[Onboarding] User decided to revoke ${otherInstallationsCount} installation`)
  // TODO
  // await client.revokeAllOtherInstallations(ethersSignerToXmtpSigner(signer));
  logger.debug(`[Onboarding] Installations revoked.`)
  return true
}
