import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Alert, Platform } from "react-native";
import { config } from "@/config";
import { getAppSettingsQueryOptions } from "@/features/app-settings/app-settings.query";
import { openLink } from "@/utils/linking";

export function useIsCurrentVersionEnough() {
  const {
    data: currentVersionIsEnough,
    isFetching: isCheckingIfCurrentVersionIsEnough,
  } = useQuery({
    ...getAppSettingsQueryOptions(),
    select: (backendConfig) => {
      const currentVersion = config.appVersion;

      const isCurrentVersionEnough = isVersionGreaterOrEqual({
        currentVersion,
        minimumVersion: Platform.select({
          android: backendConfig.minimumAppVersion.android,
          default: backendConfig.minimumAppVersion.ios,
        }),
      });

      return isCurrentVersionEnough;
    },
  });

  useEffect(() => {
    if (currentVersionIsEnough && !isCheckingIfCurrentVersionIsEnough) {
      Alert.alert(
        "Version is out of date",
        "Please update to the latest version",
        [
          {
            text: "Update",
            onPress: () =>
              openLink({
                url: config.appStoreUrl,
              }),
          },
        ],
      );
    }
  }, [currentVersionIsEnough, isCheckingIfCurrentVersionIsEnough]);
}

// Compare version strings like "1.2.3" by splitting into numbers
function isVersionGreaterOrEqual(args: {
  currentVersion: string;
  minimumVersion: string;
}) {
  const { currentVersion, minimumVersion } = args;

  const currentVersionParts = currentVersion.split(".").map(Number);
  const minimumVersionParts = minimumVersion.split(".").map(Number);

  for (let i = 0; i < 3; i++) {
    if (currentVersionParts[i] > minimumVersionParts[i]) {
      return true;
    }
    if (currentVersionParts[i] < minimumVersionParts[i]) {
      return false;
    }
  }
  return true;
}
