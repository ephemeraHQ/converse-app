import { Client } from "@xmtp/react-native-sdk";
import axios from "axios";
import * as Clipboard from "expo-clipboard";
import * as Updates from "expo-updates";
import { forwardRef, useImperativeHandle } from "react";
import RNFS from "react-native-fs";
import * as Sentry from "sentry-expo";

import config from "../config";
import { resetDb, getDbPath, clearDb } from "../data/db";
import {
  currentAccount,
  getAccountsList,
  useUserStore,
} from "../data/store/accountsStore";
import { deleteXmtpKey } from "../utils/keychain";
import { logout } from "../utils/logout";
import mmkv from "../utils/mmkv";
import { showActionSheetWithOptions } from "./StateHandlers/ActionSheetStateHandler";

let logs: string[] = [];
let messagesFromNetwork = 0;

export const addLog = (log: string) => {
  logs.push(log);
};

export const gotMessagesFromNetwork = (count: number) => {
  messagesFromNetwork += count;
};

export const useEnableDebug = () => {
  const userAddress = useUserStore((s) => s.userAddress);
  return config.debugMenu || config.debugAddresses.includes(userAddress);
};

const DebugButton = forwardRef((props, ref) => {
  // The component instance will be extended
  // with whatever you return from the callback passed
  // as the second argument
  useImperativeHandle(ref, () => ({
    showDebugMenu() {
      const methods: any = {
        "Export db file": async () => {
          const dbPath = await getDbPath(currentAccount());
          const dbExists = await RNFS.exists(dbPath);
          if (!dbExists) {
            alert(`SQlite file does not exist`);
            return;
          }
          console.log("LOADING...");
          const fileContent = await RNFS.readFile(dbPath, "base64");
          await axios.post("http://noemalzieu.com:3000", {
            file: fileContent,
          });
          alert("Uploaded!");
        },
        "Update app": async () => {
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
        "Reset DB": () => {
          resetDb(currentAccount());
        },
        "Delete DB": () => {
          clearDb(currentAccount());
        },
        "List files": async () => {
          // const groupPath = await RNFS.pathForGroup(config.appleAppGroup);
          // const groupFiles = await RNFS.readDir(`${groupPath}`);
          const documentsFiles = await RNFS.readDir(
            `${RNFS.DocumentDirectoryPath}/SQLite`
          );
          console.log(documentsFiles);
          // Clipboard.setStringAsync(JSON.stringify({ documentsFiles }));
          alert("Done!");
        },
        "Clear messages attachments folder": async () => {
          const messageFolder = `${RNFS.DocumentDirectoryPath}/messages`;
          await RNFS.unlink(messageFolder);
          alert("Cleared!");
        },
        "Delete XMTP Key": () => deleteXmtpKey(currentAccount()),
        "Sentry JS error": () => {
          throw new Error("My first Sentry error!");
        },
        "Sentry Native error": () => {
          Sentry.Native.nativeCrash();
        },
        "Show logs": () => {
          alert(logs.join("\n"));
        },
        "Copy logs": () => {
          Clipboard.setStringAsync(logs.join("\n"));
          alert("Copied!");
        },
        "Clear logs": () => {
          logs = [];
        },
        "Stress test SDK": async () => {
          for (let index = 0; index < 200; index++) {
            Client.createRandom();
            console.log(index);
          }
        },
        "Logout all": () => {
          const accounts = getAccountsList();
          accounts.forEach((account) => logout(account));
        },
        "Clear logout tasks": () => {
          mmkv.delete("converse-logout-tasks");
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
