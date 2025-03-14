import { translate } from "@i18n"
import { awaitableAlert } from "@utils/alert"
import { logger } from "@utils/logger"
import { IXmtpClientWithCodecs, IXmtpSigner } from "@/features/xmtp/xmtp.types"

export const revokeOtherInstallations = async (
  signer: IXmtpSigner,
  client: IXmtpClientWithCodecs,
  otherInstallationsCount: number,
) => {
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

// export const ethersSignerToXmtpSigner = (signer: ethers.Signer, isSCW?: boolean): XmtpSigner => ({
//   getAddress: () => signer.getAddress(),
//   getChainId: () => ethereum.id, // We don't really care about the chain id because we support https://eips.ethereum.org/EIPS/eip-6492
//   getBlockNumber: () => undefined,
//   walletType: () => (isSCW ? "SCW" : "EOA"),
//   signMessage: (message: string) => signer.signMessage(message),
// })
