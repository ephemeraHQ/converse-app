import { usePrivy } from "@privy-io/expo"
import { useCallback } from "react"
import { useAuthenticationStore } from "@/features/authentication/authentication.store"
import { getCurrentSender, resetMultiInboxStore } from "@/features/authentication/multi-inbox.store"
import { logoutXmtpClient } from "@/features/xmtp/xmtp-client/xmtp-client"
import { captureError } from "@/utils/capture-error"
import { GenericError } from "@/utils/error"
import { reactQueryMMKV } from "@/utils/react-query/react-query-persister"
import { reactQueryClient } from "@/utils/react-query/react-query.client"
import { authLogger } from "../../utils/logger"

export const useLogout = () => {
  const { logout: privyLogout } = usePrivy()

  const logout = useCallback(
    async (args: { caller: string }) => {
      authLogger.debug(`Logging out called by ${args.caller}`)

      // TODO: Might need to fix the order of operations here
      try {
        useAuthenticationStore.getState().actions.setStatus("signedOut")

        const currentSender = getCurrentSender()

        // TODO: Change this once we support multiple identities
        resetMultiInboxStore()

        // Clear both in-memory cache and persisted data
        reactQueryClient.getQueryCache().clear()
        reactQueryClient.clear()
        reactQueryClient.removeQueries()
        reactQueryMMKV.clearAll()

        if (currentSender) {
          logoutXmtpClient({
            inboxId: currentSender.inboxId,
          }).catch(captureError)
        }

        await privyLogout()

        authLogger.debug("Successfully logged out")
      } catch (error) {
        throw new GenericError({
          error,
          additionalMessage: "Error logging out",
        })
      }
    },
    // Don't add privyLogout to the dependencies array. It's useless and cause lots of re-renders of callers
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return { logout }
}
