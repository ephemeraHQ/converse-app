import Clipboard from "@react-native-clipboard/clipboard";
import * as Sentry from "@sentry/react-native";
import {
  getDbEncryptionKey,
  getDbEncryptionSalt,
} from "@utils/keychain/helpers";
import {
  getPreviousSessionLoggingFile,
  loggingFilePath,
  rotateLoggingFile,
} from "@utils/logger";
import { navigate } from "@utils/navigation";
import Share from "@utils/share";
import { getNativeLogFile } from "@utils/xmtpRN/logs";
import axios from "axios";
import Constants from "expo-constants";
import { Image } from "expo-image";
import * as Updates from "expo-updates";
import { forwardRef, useImperativeHandle } from "react";
import { Platform, Alert } from "react-native";

import config from "../config";
import { showActionSheetWithOptions } from "./StateHandlers/ActionSheetStateHandler";
import { getConverseDbPath } from "../data/db";
import { currentAccount, useAccountsList } from "../data/store/accountsStore";
import { getPresignedUriForUpload } from "../utils/api";
import mmkv from "../utils/mmkv";

export const useDebugEnabled = (address?: string) => {
  const accounts = useAccountsList();
  if (address && debugEnabled(address)) {
    return true;
  }
  for (const account of accounts) {
    if (debugEnabled(account)) {
      return true;
    }
  }

  return false;
};

export const debugEnabled = (address?: string) => {
  return (
    config.debugMenu ||
    (address && config.debugAddresses.includes(address.toLowerCase()))
  );
};

export async function delayToPropogate(): Promise<void> {
  // delay 1s to avoid clobbering
  return new Promise((r) => setTimeout(r, 100));
}

const DebugButton = forwardRef((props, ref) => {
  const appVersion = Constants.expoConfig?.version;
  const debugEnabled = useDebugEnabled();
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
        "Export db file": async () => {
          const dbPath = await getConverseDbPath(currentAccount());
          const RNFS = require("react-native-fs");
          const dbExists = await RNFS.exists(dbPath);
          if (!dbExists) {
            alert(`SQlite file does not exist`);
            return;
          }
          const fileContent = await RNFS.readFile(dbPath, "base64");
          const { url } = await getPresignedUriForUpload(currentAccount());
          await axios.put(url, Buffer.from(fileContent, "base64"), {
            headers: {
              "content-type": "application/octet-stream",
              "x-amz-acl": "public-read",
            },
          });
          const fileURL = new URL(url);
          const publicURL = fileURL.origin + fileURL.pathname;
          const [dbEncryptionKey, dbEncryptionSalt] = await Promise.all([
            getDbEncryptionKey(),
            getDbEncryptionSalt(),
          ]);

          Clipboard.setString(
            `Database URL: ${publicURL}\n\nPRAGMA key = '${Buffer.from(
              dbEncryptionKey
            ).toString(
              "base64"
            )}';\nPRAGMA cipher_plaintext_header_size = 32;\nPRAGMA cipher_salt = "x'${dbEncryptionSalt}'";`
          );
          alert("Database information copied to clipboard");
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
        ...(debugEnabled ? debugMethods : {}),
        "Share current session logs": async () => {
          Share.open({
            title: "Converse Log Session",
            url: `file://${loggingFilePath}`,
            type: "text/plain",
          });
        },
        "Share native logs": async () => {
          const nativeLogFilePath = await getNativeLogFile();
          Share.open({
            title: "LibXMTP Logs",
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
            title: "Converse Log Session",
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
          title: `Converse v${appVersion} (${buildNumber})`,
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
