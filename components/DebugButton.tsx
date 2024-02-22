import { useEmbeddedWallet, usePrivy } from "@privy-io/expo";
import Clipboard from "@react-native-clipboard/clipboard";
import * as Sentry from "@sentry/react-native";
import { Client } from "@xmtp/react-native-sdk";
import axios from "axios";
import { Wallet } from "ethers";
import * as Updates from "expo-updates";
import { forwardRef, useImperativeHandle } from "react";

import config from "../config";
import { resetDb, getDbPath } from "../data/db";
import {
  currentAccount,
  getChatStore,
  useCurrentAccount,
} from "../data/store/accountsStore";
import { debugLogs, resetDebugLogs } from "../utils/debug";
import { usePrivySigner } from "../utils/evm/privy";
import { getSecureItemAsync } from "../utils/keychain";
import mmkv from "../utils/mmkv";
import { showActionSheetWithOptions } from "./StateHandlers/ActionSheetStateHandler";

export const useEnableDebug = () => {
  const userAddress = useCurrentAccount() as string;
  return config.debugMenu || config.debugAddresses.includes(userAddress);
};

export async function delayToPropogate(): Promise<void> {
  // delay 1s to avoid clobbering
  return new Promise((r) => setTimeout(r, 100));
}

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
          try {
            await axios.post("http://noemalzieu.com:3000", {
              file: fileContent,
            });
            alert("Uploaded!");
          } catch (e: any) {
            console.log(e.message);
          }
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
          Sentry.nativeCrash();
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
        TestGroupsLocal: async () => {
          console.log("launching teswt");
          const aliceWallet = new Wallet(
            "3665c37a709b408432dbb8500114b02d68cd810e622b84b66022fba1c2ce9798"
          );
          const alice = await Client.create(aliceWallet, {
            env: "dev",
            enableAlphaMls: true,
          });
          console.log("alice:", alice.address);
          // const group = await alice.conversations.newGroup([currentAccount()]);
          await alice.conversations.syncGroups();
          const group = (await alice.conversations.listGroups()).find(
            (g) => g.peerAddresses?.includes(currentAccount().toLowerCase())
          );
          if (!group) {
            console.log("NOGROUP");
            return;
          }
          const conversation = await alice.conversations.newConversation(
            currentAccount()
          );
          console.log("group exists", group.id);
          console.log("conversation exists", conversation.topic);
          await conversation.send("CONVO MESSAGE");
          console.log("convo message sent");
          await group.send("GROUP MESSAGE");
          console.log("group message sent");
        },
        TestGroups: async () => {
          console.log("launching teswt");
          const aliceWallet = new Wallet(
            "3665c37a709b408432dbb8500114b02d68cd810e622b84b66022fba1c2ce9798"
          );
          const alice = await Client.create(aliceWallet, {
            env: "dev",
            enableAlphaMls: true,
          });
          console.log("alice:", alice.address);
          const bobWallet = new Wallet(
            "ed3c89e38117d92baa6132aad1a96fa1479eb5808548e1955cfb0f1830005d2b"
          );
          const bob = await Client.create(bobWallet, {
            env: "dev",
            enableAlphaMls: true,
          });
          console.log("bob:", bob.address);
          console.log("created clients");

          await delayToPropogate();

          await bob.conversations.syncGroups();
          await alice.conversations.syncGroups();

          // Lets create
          // const group = await alice.conversations.newGroup([bob.address]);

          const aliceGroup = (await alice.conversations.listGroups())[0];
          // console.log(aliceGroup);
          if (aliceGroup.peerAddresses.includes(bob.address.toLowerCase())) {
            console.log("bob is in alice group !!");
          }
          const groups = await bob.conversations.listGroups();
          console.log("we have a bob group", groups.length);
          const convo = await bob.conversations.newConversation(
            aliceWallet.address
          );
          console.log("convo id", convo.topic);

          let messagesReceivedCount = 0;

          await alice.conversations.streamAll(async (c) => {
            console.log("streamed a convo/group");
          });

          // console.log("created a client for alice, lets create a new group");
          await alice.conversations.streamAllMessages(async (message) => {
            console.log(
              "Alice just received a message",
              message.nativeContent?.text
            );
            messagesReceivedCount += 1;
          }, true);

          await bob.conversations.streamAllMessages(async (message) => {
            console.log(
              "Bob just received a message",
              message.nativeContent?.text
            );
            messagesReceivedCount += 1;
          }, true);

          await delayToPropogate();

          // Sending 8 messages, each received by 2 people
          await convo.send("Convo message 1 from bob");
          await convo.send("Convo message 2 from bob");
          await groups[0].send("Group message 1 from bob");
          await groups[0].send("Group message 2 from bob");
          await convo.send("Convo message 3 from bob");
          await convo.send("Convo message 4 from bob");
          await groups[0].send("Group message 3 from bob");
          await groups[0].send("Group message 4 from bob");

          await delayToPropogate();
          if (messagesReceivedCount !== 16) {
            console.log("MESSAGE RECEIVED IS NOT 16 " + messagesReceivedCount);
          }
          // console.log("group created");
          // const convo = await alice.conversations.newConversation(currentAccount());
          // console.log("convo created");
          // await alice.conversations.cancelStreamAllMessages();
          // await delayToPropogate();
          // await group.send("group");
          // await convo.send("conversations")
          // console.log("messages sent");
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
