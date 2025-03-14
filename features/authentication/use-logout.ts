import { usePrivy } from "@privy-io/expo"
import { useCallback } from "react"
import { useAuthenticationStore } from "@/features/authentication/authentication.store"
import { resetMultiInboxStore } from "@/features/authentication/multi-inbox.store"
import { captureError } from "@/utils/capture-error"
import { GenericError } from "@/utils/error"
import { reactQueryClient } from "@/utils/react-query/react-query.client"
import { reactQueryMMKV, secureQueryMMKV } from "@/utils/react-query/react-query.utils"
import { logger } from "../../utils/logger"

export const useLogout = () => {
  const { logout: privyLogout } = usePrivy()

  const logout = useCallback(
    async (args: { caller: string }) => {
      logger.debug(`Logging out called by ${args.caller}`)

      try {
        useAuthenticationStore.getState().actions.setStatus("signedOut")

        // Call this here for now since we can only have 1 identity
        resetMultiInboxStore()

        // Clear both in-memory cache and persisted data
        reactQueryClient.getQueryCache().clear()
        reactQueryClient.clear()
        reactQueryClient.removeQueries()
        reactQueryMMKV.clearAll()
        secureQueryMMKV.clearAll()

        await privyLogout()

        logger.debug("Successfully logged out")
      } catch (error) {
        captureError(
          new GenericError({
            error,
            additionalMessage: "Error logging out",
          }),
        )
      }
    },
    [privyLogout],
  )

  return { logout }
}
