import { useAuthenticationStore } from "@/features/authentication/authentication.store"
import { getCurrentSender } from "@/features/authentication/multi-inbox.store"
import { ensureXmtpInstallationQueryData } from "@/features/xmtp/xmtp-installations/xmtp-installation.query"
import { validateXmtpInstallation } from "@/features/xmtp/xmtp-installations/xmtp-installations"
import { captureError } from "@/utils/capture-error"
import { authLogger } from "@/utils/logger"

export async function hydrateAuth() {
  authLogger.debug("Hydrating auth")

  const currentSender = getCurrentSender()

  if (!currentSender) {
    authLogger.debug("No current sender, setting status to signed out")
    useAuthenticationStore.getState().actions.setStatus("signedOut")
    return
  }

  try {
    await ensureXmtpInstallationQueryData({
      inboxId: currentSender.inboxId,
    })

    // Don't do it with await because we prefer doing it in the background and letting user continue
    validateXmtpInstallation({
      inboxId: currentSender.inboxId,
    })
      .then((isValid) => {
        if (!isValid) {
          useAuthenticationStore.getState().actions.setStatus("signedOut")
        }
      })
      .catch(captureError)
  } catch (error) {
    captureError(error)
    useAuthenticationStore.getState().actions.setStatus("signedOut")
    return
  }

  useAuthenticationStore.getState().actions.setStatus("signedIn")
}
