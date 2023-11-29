import { useEmbeddedWallet, usePrivy } from "@privy-io/expo";
import { Client, DecodedMessage } from "@xmtp/react-native-sdk";
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
  useCurrentAccount,
} from "../data/store/accountsStore";
import { usePrivySigner } from "../utils/evm/helpers";
import { deleteXmtpKey, getSecureItemAsync } from "../utils/keychain";
import { logout } from "../utils/logout";
import mmkv from "../utils/mmkv";
import { getXmtpClient } from "../utils/xmtpRN/client";
import { showActionSheetWithOptions } from "./StateHandlers/ActionSheetStateHandler";

let logs: string[] = [];

export const addLog = (log: string) => {
  if (config.debugMenu || config.debugAddresses.includes(currentAccount())) {
    logs.push(log);
  }
};

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
        DebugDaria: async () => {
          const queryConversationsFromTimestamp = {
            "/xmtp/0/m-5IMAK3f7IwEcfFoJ615n23bRqpKBnz4yRYXgNg3IasM/proto": 0,
          } as { [key: string]: number };
          const client = await getXmtpClient(currentAccount());
          while (Object.keys(queryConversationsFromTimestamp).length > 0) {
            const topicsToQuery = Object.keys(queryConversationsFromTimestamp);
            addLog(
              `Loading messages for ${
                topicsToQuery.length
              } conversations: ${JSON.stringify(
                queryConversationsFromTimestamp
              )}`
            );

            // We want to find out which topic breaks everything
            const messagesBatch = await client.listBatchMessages(
              topicsToQuery.map((topic) => ({
                contentTopic: topic,
                startTime: new Date(queryConversationsFromTimestamp[topic]),
                pageSize: 2,
                direction: "SORT_DIRECTION_ASCENDING",
              }))
            );

            const oldQueryConversationsFromTimestamp = {
              ...queryConversationsFromTimestamp,
            };

            const messagesByTopic: { [topic: string]: DecodedMessage[] } = {};
            messagesBatch.forEach((m) => {
              messagesByTopic[m.topic] = messagesByTopic[m.topic] || [];
              messagesByTopic[m.topic].push(m);
              if (m.sent > queryConversationsFromTimestamp[m.topic]) {
                queryConversationsFromTimestamp[m.topic] = m.sent;
              }
            });

            topicsToQuery.forEach((topic) => {
              const messages = messagesByTopic[topic];
              if (!messages || messages.length <= 1) {
                // When we have no more messages for a topic it means we have gone through all of it
                // Checking if messages.length < BATCH_QUERY_PAGE_SIZE would be more performant (one less query
                // per topic) but could miss messages because if there are messages that are not decoded they
                // are not returned by listBatchMessages)
                delete queryConversationsFromTimestamp[topic];
              }
            });

            // To avoid a loop let's verify that we don't query a topic
            // again with the exact same timestamp
            Object.keys(queryConversationsFromTimestamp).forEach((topic) => {
              if (
                queryConversationsFromTimestamp[topic] ===
                oldQueryConversationsFromTimestamp[topic]
              ) {
                console.log(
                  "[XmtpRn] Avoiding a loop during sync due to weird timestamps"
                );
                addLog(`Avoiding a loop`);
                queryConversationsFromTimestamp[topic] += 1;
              }
            });

            let timestamp = 0;
            if (messagesBatch.length > 0) {
              timestamp = messagesBatch[messagesBatch.length - 1].sent;
            }

            addLog(`Got ${messagesBatch.length} messages - ${timestamp}`);
          }
          Clipboard.setStringAsync(logs.join("\n"));
          alert("FINISHED - LOGS COPIED");
        },
        Privy: async () => {
          const keys = [
            "privy-token",
            "privy-refresh_token",
            "privy-session",
            "privy-session_transfer_token",
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
          Clipboard.setStringAsync(result);
        },
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
