import { useEmbeddedWallet, usePrivy } from "@privy-io/expo";
import Clipboard from "@react-native-clipboard/clipboard";
import axios from "axios";
import * as Updates from "expo-updates";
import { forwardRef, useImperativeHandle } from "react";
import * as Sentry from "sentry-expo";

import config from "../config";
import { resetDb, getDbPath } from "../data/db";
import {
  currentAccount,
  getChatStore,
  useCurrentAccount,
} from "../data/store/accountsStore";
import { debugLogs, resetDebugLogs } from "../utils/debug";
import { usePrivySigner } from "../utils/evm/helpers";
import { getSecureItemAsync } from "../utils/keychain";
import mmkv from "../utils/mmkv";
import { showActionSheetWithOptions } from "./StateHandlers/ActionSheetStateHandler";

export const useEnableDebug = () => {
  const userAddress = useCurrentAccount() as string;
  return config.debugMenu || config.debugAddresses.includes(userAddress);
};

const DebugButton = forwardRef((props, ref) => {
  const embeddedWallet = useEmbeddedWallet();
  const privySigner = usePrivySigner();
  const { isReady: privyReady, user: privyUser } = usePrivy();
  // The component instance will be extended
  // with whatever you return from the callback passed
  // as the second argument
  useImperativeHandle(ref, () => ({
    showDebugMenu() {
      const methods: any = {
        Privy: async () => {
          const keys = [
            "privy-token",
            "privy-refresh_token",
            "privy-session",
            "privy-session_transfer_token",
            "privy-token-old",
            "privy-refresh_token-old",
          ];
          const values = await Promise.all(
            keys.map((k) => getSecureItemAsync(k))
          );
          let result = `Privy ready: ${privyReady}\nPrivyUser: ${!!privyUser}\nEmbedded wallet status: ${
            embeddedWallet.status
          }\nprivySigner: ${!!privySigner}`;
          keys.forEach((k, i) => {
            const v = values[i];
            result = `${result}\n${k}:${v}\n`;
          });
          alert(result);
          Clipboard.setString(result);
        },
        "Export db file": async () => {
          const dbPath = await getDbPath(currentAccount());
          const RNFS = require("react-native-fs");
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
          getChatStore(currentAccount()).getState().setLastSyncedAt(0, []);
        },
        "Reset lastSyncedAt": () => {
          getChatStore(currentAccount()).getState().setLastSyncedAt(0, []);
        },
        "Clear messages attachments folder": async () => {
          const RNFS = require("react-native-fs");
          const messageFolder = `${RNFS.DocumentDirectoryPath}/messages`;
          await RNFS.unlink(messageFolder);
          alert("Cleared!");
        },
        "Sentry JS error": () => {
          throw new Error("My first Sentry error!");
        },
        "Sentry Native error": () => {
          Sentry.Native.nativeCrash();
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
