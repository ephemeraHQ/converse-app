import { translate } from "@/i18n";
import { getNativeLogFile } from "@/utils/xmtpRN/logs";
import * as Sentry from "@sentry/react-native";
import {
  getPreviousSessionLoggingFile,
  loggingFilePath,
  rotateLoggingFile,
} from "@utils/logger";
import { navigate } from "@utils/navigation";
import Share from "@utils/share";
import Constants from "expo-constants";
import { Image } from "expo-image";
import * as Updates from "expo-updates";
import { forwardRef, useImperativeHandle } from "react";
import { Alert, Platform } from "react-native";
import { config } from "../config";
import {
  useAccountsList,
  getAccountsList,
} from "../features/multi-inbox/multi-inbox.store";
import mmkv from "../utils/mmkv";
import { showActionSheetWithOptions } from "./StateHandlers/ActionSheetStateHandler";
import { logoutAccount } from "@/utils/logout";

export async function delayToPropogate(): Promise<void> {
  // delay 1s to avoid clobbering
  return new Promise((r) => setTimeout(r, 100));
}

const DebugButton = forwardRef((props, ref) => {
  const appVersion = Constants.expoConfig?.version;
  const buildNumber =
    Platform.OS === "ios"
      ? Constants.expoConfig?.ios?.buildNumber
      : Constants.expoConfig?.android?.versionCode;
  // The component instance will be extended
  // with whatever you return from the callback passed
  // as the second argument
  useImperativeHandle(ref, () => ({
    showDebugMenu() {
      const debugMethods = {
        "Logout all accounts": async () => {
          const allAccounts = getAccountsList();
          try {
            for (const account of allAccounts) {
              await logoutAccount({ account });
            }
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
        "Clear logout tasks": () => {
          mmkv.delete("converse-logout-tasks");
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
      const methods: any = {
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
        "Display current session logs": async () => {
          navigate("WebviewPreview", { uri: loggingFilePath });
        },
        "Display native logs": async () => {
          const nativeLogFilePath = await getNativeLogFile();
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
      const options = Object.keys(methods);

      showActionSheetWithOptions(
        {
          title: translate("debug.converse_version", {
            version: appVersion,
            buildNumber,
          }),
          options,
          cancelButtonIndex: options.indexOf("Cancel"),
        },
        (selectedIndex?: number) => {
          if (selectedIndex === undefined) return;
          const method = methods[options[selectedIndex]];
          if (method) {
            method();
          }
        }
      );
    },
  }));

  return null;
});

export default DebugButton;
