import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import { Alert, Platform } from "react-native"
import { config } from "@/config"
import { getAppSettingsQueryOptions } from "@/features/app-settings/app-settings.query"
import { openLink } from "@/utils/linking"

type VersionComparisonArgs = {
  currentVersion: string
  minimumVersion: string
}

function parseVersion(version: string): number[] {
  return version.split(".").map(Number)
}

// Compare version strings like "1.2.3"
function isVersionGreaterOrEqual(args: VersionComparisonArgs) {
  const { currentVersion, minimumVersion } = args

  const current = parseVersion(currentVersion)
  const minimum = parseVersion(minimumVersion)

  // Compare each version segment
  for (let i = 0; i < 3; i++) {
    if (current[i] > minimum[i]) {
      return true
    }
    if (current[i] < minimum[i]) {
      return false
    }
  }
  return true
}

export function useIsCurrentVersionEnough() {
  const { data: currentVersionIsEnough, isFetching: isCheckingIfCurrentVersionIsEnough } = useQuery(
    {
      ...getAppSettingsQueryOptions(),
      select: (backendConfig) => {
        const minimumVersion = Platform.select({
          android: backendConfig.minimumAppVersion.android,
          default: backendConfig.minimumAppVersion.ios,
        })

        return isVersionGreaterOrEqual({
          currentVersion: config.app.version,
          minimumVersion,
        })
      },
    },
  )

  useEffect(() => {
    const shouldShowUpdateAlert =
      typeof currentVersionIsEnough === "boolean" &&
      !currentVersionIsEnough &&
      !isCheckingIfCurrentVersionIsEnough &&
      !__DEV__

    if (shouldShowUpdateAlert) {
      Alert.alert("Version is out of date", "Please update to the latest version", [
        {
          text: "Update",
          onPress: () => openLink({ url: config.app.storeUrl }),
        },
      ])
    }
  }, [currentVersionIsEnough, isCheckingIfCurrentVersionIsEnough])
}
