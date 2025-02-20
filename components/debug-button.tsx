import { useLogout } from "@/features/authentication/use-logout.hook";
import { translate } from "@/i18n";
import { converseEventEmitter } from "@/utils/events";
import { getNativeLogFile } from "@/utils/xmtpRN/logs";
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
import { useCallback, useEffect, useMemo } from "react";
import { Alert, Platform } from "react-native";
import { showActionSheet } from "./action-sheet";

export function DebugButton() {
  const { logout } = useLogout();

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
          }mediacache`
        );
        alert("Done!");
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
        const nativeLogFilePath = await getNativeLogFile();
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
      // "Display current session logs": async () => {
      //   navigate("WebviewPreview", { uri: loggingFilePath });
      // },
      // "Display native logs": async () => {
      //   const nativeLogFilePath = await getNativeLogFile();
      //   navigate("WebviewPreview", { uri: nativeLogFilePath });
      // },
      // "Display previous session logs": async () => {
      //   const previousLoggingFile = await getPreviousSessionLoggingFile();
      //   if (!previousLoggingFile) {
      //     return Alert.alert("No previous session logging file found");
      //   }
      //   navigate("WebviewPreview", { uri: previousLoggingFile });
      // },
      // Cancel: undefined,
    };
  }, [logout]);

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

  useEffect(() => {
    converseEventEmitter.on("showDebugMenu", showDebugMenu);
    return () => {
      converseEventEmitter.off("showDebugMenu", showDebugMenu);
    };
  }, [showDebugMenu]);

  return null;
}
