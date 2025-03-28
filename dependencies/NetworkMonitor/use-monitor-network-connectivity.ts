import NetInfo from "@react-native-community/netinfo"
import { logger } from "@utils/logger"
import { useEffect } from "react"
import { config } from "../../config"
import { useAppStore } from "../../stores/app-store"
import { useSelect } from "../../stores/stores.utils"

NetInfo.configure({
  reachabilityUrl: `${config.app.apiUrl}/healthcheck`,
  reachabilityMethod: "HEAD",
  reachabilityTest: async (response) => response.status === 200,
})

export function useMonitorNetworkConnectivity() {
  const { isInternetReachable, setIsInternetReachable } = useAppStore(
    useSelect(["isInternetReachable", "setIsInternetReachable"]),
  )

  useEffect(() => {
    return NetInfo.addEventListener((netState) => {
      const reachable = !!netState.isInternetReachable
      if (reachable !== isInternetReachable) {
        logger.debug(`Internet reachable: ${reachable}`)
        setIsInternetReachable(reachable)
      }
    })
  }, [isInternetReachable, setIsInternetReachable])
}
