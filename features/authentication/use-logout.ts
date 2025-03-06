import { usePrivy } from "@privy-io/expo"
import { useCallback } from "react"
import { resetAccountStore } from "@/features/authentication/multi-inbox.store"
import { captureError } from "@/utils/capture-error"
import { GenericError } from "@/utils/error"
import { reactQueryMMKV, secureQueryMMKV } from "@/utils/mmkv"
import { reactQueryClient } from "@/utils/react-query/react-query-client"
import { logger } from "../../utils/logger"

export const useLogout = () => {
  const { logout: privyLogout } = usePrivy()

  const logout = useCallback(
    async (args: { caller: string }) => {
      logger.debug(`Logging out called by ${args.caller}`)

      try {
        resetAccountStore()

        // Clear both in-memory cache and persisted data
        reactQueryClient.getQueryCache().clear()
        reactQueryClient.clear()
        reactQueryClient.removeQueries()
        reactQueryMMKV.clearAll()
        secureQueryMMKV.clearAll()

        // First logout from Privy
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
