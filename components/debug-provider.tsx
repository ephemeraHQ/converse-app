import * as Sentry from "@sentry/react-native";
import {
  getPreviousSessionLoggingFile,
  loggingFilePath,
  rotateLoggingFile,
} from "@utils/logger";
import Share from "@utils/share";
import Constants from "expo-constants";
import { Image } from "expo-image";
import * as Updates from "expo-updates";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Alert, Platform } from "react-native";
import { VStack } from "@/design-system/VStack";
import { useLogout } from "@/features/authentication/use-logout";
import { getXmtpNativeLogFile } from "@/features/xmtp/utils/xmtp-logs";
import { translate } from "@/i18n";
import { navigate } from "@/navigation/navigation.utils";
import { $globalStyles } from "@/theme/styles";
import { getEnv } from "@/utils/getEnv";
import { showActionSheet } from "./action-sheet";

export function DebugProvider(props: { children: React.ReactNode }) {
  const { children } = props;

  const { logout } = useLogout();

  const { currentlyRunning } = Updates.useUpdates();

  const methods = useMemo(() => {
    // Debug menu options and their corresponding actions
    const debugMethods = {
      Logout: async () => {
        try {
          await logout();
        } catch (error) {
          alert(error);
        }
      },
      "Trigger OTA Update": async () => {
        try {
          const update = await Updates.fetchUpdateAsync();
          if (update.isNew) {
            await Updates.reloadAsync();
          } else {
            alert("No new update");
          }
        } catch (error) {
          alert(error);
        }
      },
      "Sentry JS error": () => {
        throw new Error("My first Sentry error!");
      },
      "Sentry Native error": () => {
        Sentry.nativeCrash();
      },
      "Clear expo image cache": async () => {
        await Image.clearDiskCache();
        await Image.clearMemoryCache();
        alert("Done!");
      },
      "Clear converse media cache": async () => {
        const RNFS = require("react-native-fs");
        await RNFS.unlink(
          `file://${RNFS.CachesDirectoryPath}${
            RNFS.CachesDirectoryPath.endsWith("/") ? "" : "/"
          }mediacache`,
        );
        alert("Done!");
      },
      "Show App Info": () => {
        const appVersion = Constants.expoConfig?.version;
        const buildNumber =
          Platform.OS === "ios"
            ? Constants.expoConfig?.ios?.buildNumber
            : Constants.expoConfig?.android?.versionCode;
        const environment = getEnv();

        Alert.alert(
          "App Information",
          [
            `Version: ${appVersion}`,
            `Build: ${buildNumber}`,
            `Environment: ${environment}`,
            `Update ID: ${currentlyRunning.updateId || "embedded"}`,
            `Created At: ${
              currentlyRunning.createdAt?.toLocaleString() || "N/A"
            }`,
            `Runtime Version: ${currentlyRunning.runtimeVersion}`,
            `Channel: ${currentlyRunning.channel || "N/A"}`,
            `Is Embedded: ${currentlyRunning.isEmbeddedLaunch}`,
            currentlyRunning.isEmergencyLaunch ? `Emergency Launch: Yes` : "",
            currentlyRunning.emergencyLaunchReason
              ? `Emergency Reason: ${currentlyRunning.emergencyLaunchReason}`
              : "",
          ]
            .filter(Boolean)
            .join("\n"),
        );
      },
      "Check for Updates": async () => {
        try {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            Alert.alert(
              "Update Available",
              "Would you like to download and install the update?",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Update",
                  onPress: async () => {
                    try {
                      const fetchedUpdate = await Updates.fetchUpdateAsync();
                      if (fetchedUpdate.isNew) {
                        await Updates.reloadAsync();
                      }
                    } catch (error) {
                      Alert.alert("Error", JSON.stringify(error));
                    }
                  },
                },
              ],
            );
          } else {
            Alert.alert("No Updates", "You are running the latest version");
          }
        } catch (error) {
          Alert.alert("Error", JSON.stringify(error));
        }
      },
    };

    return {
      ...debugMethods,
      "Share current session logs": async () => {
        Share.open({
          title: translate("debug.converse_log_session"),
          url: `file://${loggingFilePath}`,
          type: "text/plain",
        });
      },
      "Share native logs": async () => {
        const nativeLogFilePath = await getXmtpNativeLogFile();
        Share.open({
          title: translate("debug.libxmtp_log_session"),
          url: `file://${nativeLogFilePath}`,
          type: "text/plain",
        });
      },
      "Share previous session logs": async () => {
        const previousLoggingFile = await getPreviousSessionLoggingFile();
        if (!previousLoggingFile) {
          return Alert.alert("No previous session logging file found");
        }
        Share.open({
          title: translate("debug.converse_log_session"),
          url: `file://${previousLoggingFile}`,
          type: "text/plain",
        });
      },
      "New log session": rotateLoggingFile,
      "Display current session logs": async () => {
        navigate("WebviewPreview", { uri: loggingFilePath });
      },
      "Display native logs": async () => {
        const nativeLogFilePath = await getXmtpNativeLogFile();
        navigate("WebviewPreview", { uri: nativeLogFilePath });
      },
      "Display previous session logs": async () => {
        const previousLoggingFile = await getPreviousSessionLoggingFile();
        if (!previousLoggingFile) {
          return Alert.alert("No previous session logging file found");
        }
        navigate("WebviewPreview", { uri: previousLoggingFile });
      },
      Cancel: undefined,
    };
  }, [logout, currentlyRunning]);

  const showDebugMenu = useCallback(() => {
    const options = Object.keys(methods);

    const appVersion = Constants.expoConfig?.version;
    const buildNumber =
      Platform.OS === "ios"
        ? Constants.expoConfig?.ios?.buildNumber
        : Constants.expoConfig?.android?.versionCode;

    showActionSheet({
      options: {
        title: `Converse v${appVersion} (${buildNumber})`,
        options,
        cancelButtonIndex: options.indexOf("Cancel"),
      },
      callback: (selectedIndex?: number) => {
        if (selectedIndex === undefined) return;
        const method = methods[options[selectedIndex] as keyof typeof methods];
        if (method) {
          method();
        }
      },
    });
  }, [methods]);

  const tapCountRef = useRef(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout>();

  const handleTouchStart = useCallback(() => {
    // Increment tap count
    tapCountRef.current += 1;

    // Clear existing timeout
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    // Set new timeout to reset count after 500ms
    tapTimeoutRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 500);

    // Show debug menu after 5 taps
    if (tapCountRef.current >= 5) {
      showDebugMenu();
      tapCountRef.current = 0;
    }
  }, [showDebugMenu]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, []);

  return (
    <VStack onTouchStart={handleTouchStart} style={$globalStyles.flex1}>
      {children}
    </VStack>
  );
}
