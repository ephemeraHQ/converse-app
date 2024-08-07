import Clipboard from "@react-native-clipboard/clipboard";
import * as Sentry from "@sentry/react-native";
import { loggingFilePath, rotateLoggingFile } from "@utils/logger";
import axios from "axios";
import { Image } from "expo-image";
import * as Updates from "expo-updates";
import { forwardRef, useImperativeHandle } from "react";
import { Share } from "react-native";

import { showActionSheetWithOptions } from "./StateHandlers/ActionSheetStateHandler";
import config from "../config";
import { getConverseDbPath } from "../data/db";
import { currentAccount, useCurrentAccount } from "../data/store/accountsStore";
import { getPresignedUriForUpload } from "../utils/api";
import mmkv from "../utils/mmkv";

export const useEnableDebug = () => {
  const userAddress = useCurrentAccount() as string;
  return config.debugMenu || config.debugAddresses.includes(userAddress);
};

export async function delayToPropogate(): Promise<void> {
  // delay 1s to avoid clobbering
  return new Promise((r) => setTimeout(r, 100));
}

const DebugButton = forwardRef((props, ref) => {
  // The component instance will be extended
  // with whatever you return from the callback passed
  // as the second argument
  useImperativeHandle(ref, () => ({
    showDebugMenu() {
      const methods: any = {
        "Share session logs": async () => {
          Share.share({
            title: "Converse Log Session",
            url: `file://${loggingFilePath}`,
          });
        },
        "New log session": rotateLoggingFile,
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
            headers: { "content-type": "application/octet-stream" },
          });
          Clipboard.setString(url);
          alert("Uploaded URL Copied");
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
        Cancel: undefined,
      };
      const options = Object.keys(methods);

      showActionSheetWithOptions(
        {
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
