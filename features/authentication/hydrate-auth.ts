import { useAuthenticationStore } from "@/features/authentication/authentication.store"
import { getCurrentSender } from "@/features/authentication/multi-inbox.store"
import { getXmtpClientByEthAddress } from "@/features/xmtp/xmtp-client/xmtp-client.service"
import { validateClientInstallation } from "@/features/xmtp/xmtp-installations/xmtp-installations"
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
    const xmtpClient = await getXmtpClientByEthAddress({
      ethAddress: currentSender.ethereumAddress,
    })

    if (!xmtpClient) {
      throw new Error("Failed to ensure XMTP client")
    }

    const isValid = await validateClientInstallation({
      client: xmtpClient,
    })

    if (!isValid) {
      throw new Error("Invalid client installation")
    }
  } catch (error) {
    captureError(error)
    useAuthenticationStore.getState().actions.setStatus("signedOut")
    return
  }

  useAuthenticationStore.getState().actions.setStatus("signedIn")
}
