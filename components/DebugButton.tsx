import Clipboard from "@react-native-clipboard/clipboard";
import { Client } from "@xmtp/react-native-sdk";
import axios from "axios";
import { Image } from "expo-image";
import * as Updates from "expo-updates";
import { forwardRef, useImperativeHandle } from "react";

import config from "../config";
import { resetDb, getDbPath } from "../data/db";
import {
  currentAccount,
  getChatStore,
  useCurrentAccount,
} from "../data/store/accountsStore";
import { getPresignedUriForUpload } from "../utils/api";
import { debugLogs, resetDebugLogs } from "../utils/debug";
import mmkv from "../utils/mmkv";
import { showActionSheetWithOptions } from "./StateHandlers/ActionSheetStateHandler";

export const useEnableDebug = () => {
  const userAddress = useCurrentAccount() as string;
  return config.debugMenu || config.debugAddresses.includes(userAddress);
};

const DebugButton = forwardRef((props, ref) => {
  // The component instance will be extended
  // with whatever you return from the callback passed
  // as the second argument
  useImperativeHandle(ref, () => ({
    showDebugMenu() {
      const methods: any = {
        DebugIt: async () => {
          console.log("go");
          const bob = await Client.createRandom({ env: "dev" });
          const alice = await Client.createRandom({ env: "dev" });
          const bobToAlice = await bob.conversations.newConversation(
            alice.address
          );
          console.log(`Streaming messages for alice`);
          let receivedMessages = 0;
          await alice.conversations.streamAllMessages(async (message) => {
            console.log(
              `Alice received a message from ${message.senderAddress}`
            );
            receivedMessages += 1;
          });
          await bobToAlice.send("first message");
          await new Promise((r) => setTimeout(r, 6000));
          if (receivedMessages !== 1) {
            alert("SHOULD BE 1");
            return;
          }
          console.log({ receivedMessages });
          let timeSpent = 0;
          const minutesToWait = 8;
          while (timeSpent < minutesToWait * 60 * 1000) {
            await new Promise((r) => setTimeout(r, 5000));
            timeSpent += 5000;
            console.log(`${timeSpent / (minutesToWait * 60 * 10)}%`);
          }
          await bobToAlice.send("second message");
          await new Promise((r) => setTimeout(r, 5000));
          alert(`received: ${receivedMessages}`);
        },
        "Update OTA": async () => {
          try {
            const update = await Updates.fetchUpdateAsync();
            if (update.isNew) {
              await Updates.reloadAsync();
            } else {
              alert("No new update");
            }
          } catch (error) {
            alert(error);
            console.error(error);
          }
        },
        "Export db file": async () => {
          const dbPath = await getDbPath(currentAccount());
          const RNFS = require("react-native-fs");
          const dbExists = await RNFS.exists(dbPath);
          if (!dbExists) {
            alert(`SQlite file does not exist`);
            return;
          }
          console.log("LOADING content......");
          const fileContent = await RNFS.readFile(dbPath, "base64");
          const { url } = await getPresignedUriForUpload(currentAccount());
          console.log("Uploading...", { url });
          await axios.put(url, Buffer.from(fileContent, "base64"), {
            headers: { "content-type": "application/octet-stream" },
          });
          Clipboard.setString(url);
          alert("Uploaded URL Copied");
        },

        "Reset DB": () => {
          resetDb(currentAccount());
          getChatStore(currentAccount()).getState().setLastSyncedAt(0, []);
        },
        "Reset lastSyncedAt": () => {
          getChatStore(currentAccount()).getState().setLastSyncedAt(0, []);
        },
        "Show logs": () => {
          alert(debugLogs.join("\n"));
        },
        "Copy logs": () => {
          Clipboard.setString(debugLogs.join("\n"));
          alert("Copied!");
        },
        "Clear logs": resetDebugLogs,
        "Clear logout tasks": () => {
          mmkv.delete("converse-logout-tasks");
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
