import React, { useCallback, useEffect, useRef } from "react";
import { Alert, AppState, Platform, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import uuid from "react-native-uuid";
import { WebView, WebViewMessageEvent } from "react-native-webview";

import config from "../config";
import { saveConversations } from "../data/helpers/conversations/upsertConversations";
import { saveMessages } from "../data/helpers/messages";
import {
  useAccountsStore,
  useChatStore,
  useSettingsStore,
  useUserStore,
} from "../data/store/accountsStore";
import { useAppStore } from "../data/store/appStore";
import {
  loadXmtpKeys,
  saveXmtpConversations,
  saveXmtpKeys,
} from "../utils/keychain";
import {
  loadSavedNotificationMessagesToContext,
  subscribeToNotifications,
} from "../utils/notifications";
import { pick } from "../utils/objects";
import { sentryTrackMessage } from "../utils/sentry";
import { gotMessagesFromNetwork } from "./DebugButton";

let webview: WebView | null;
let webviewReadyForMessages = false;
let isReconnecting = false;
let lastRetryAt = 0;

const hideDataFromEvents = [
  "XMTP_MESSAGES",
  "SAVE_KEYS",
  "KEYS_LOADED_FROM_SECURE_STORAGE",
  "XMTP_CONVERSATIONS",
  "RELOAD",
  "LOAD_CONVERSATIONS_AND_MESSAGES",
  "XMTP_EXPORTED_CONVERSATIONS",
  "UPLOAD_ATTACHMENT",
  "ATTACHMENT_UPLOAD_RESULT",
  "DECODE_ATTACHMENT_RESULT",
  "DECODE_ATTACHMENT",
];

// let lastNavigation: any;
// let lastCreateConvoFromNewConvoScreen = false;
const tasksCallbacks: {
  [uid: string]: (data: any) => void;
} = {};

// export const saveWebviewNavigation = (navigation: any) => {
//   lastNavigation = navigation;
// };

// export const setLastCreateConvoFromNewConvoScreen = (isFrom: boolean) => {
//   lastCreateConvoFromNewConvoScreen = isFrom;
// };

export const sendMessageToWebview = (
  eventName: string,
  data?: any,
  callback?: (data?: any) => void
) => {
  if (!webview) {
    setTimeout(() => {
      sendMessageToWebview(eventName, data);
    }, 120);
    return;
  }
  if (eventName !== "PING" && !webviewReadyForMessages) {
    setTimeout(() => {
      sendMessageToWebview(eventName, data);
    }, 120);
    return;
  }

  console.log(
    `[Expo  ➡️   Webview]: ${eventName}`,
    (!hideDataFromEvents.includes(eventName) && data) || ""
  );

  if (callback) {
    const taskId = uuid.v4().toString();
    data.taskId = taskId;
    tasksCallbacks[taskId] = callback;
  }
  webview.postMessage(JSON.stringify({ eventName, data }));
};

export default function XmtpWebview() {
  const appState = useRef(AppState.currentState);
  const loadedKeys = useRef(false);
  const web3Connected = useRef(false);
  const currentAccount = useAccountsStore((s) => s.currentAccount);

  const {
    initialLoadDone,
    setInitialLoadDone,
    webviewClientConnected,
    setWebviewClientConnected,
    setResyncing,
    setReconnecting,
    conversations,
  } = useChatStore((s) =>
    pick(s, [
      "initialLoadDone",
      "setInitialLoadDone",
      "webviewClientConnected",
      "setWebviewClientConnected",
      "setResyncing",
      "setReconnecting",
      "conversations",
    ])
  );
  const { userAddress, setUserAddress } = useUserStore((s) =>
    pick(s, ["userAddress", "setUserAddress"])
  );
  const { isInternetReachable, notificationsPermissionStatus } = useAppStore(
    (s) => pick(s, ["isInternetReachable", "notificationsPermissionStatus"])
  );
  const blockedPeers = useSettingsStore((s) => s.blockedPeers);

  useEffect(() => {
    const messagesReadyInterval = setInterval(() => {
      if (!webviewReadyForMessages) {
        sendMessageToWebview("PING");
      }
    }, 300);

    return () => {
      clearInterval(messagesReadyInterval);
    };
  }, []);

  const loadKeys = useCallback(async () => {
    const keys = await loadXmtpKeys();
    sendMessageToWebview("KEYS_LOADED_FROM_SECURE_STORAGE", {
      keys,
      env: config.xmtpEnv,
    });
    loadedKeys.current = true;
  }, []);

  useEffect(() => {
    if (!loadedKeys.current && userAddress) {
      loadKeys();
    }
  }, [loadKeys, userAddress]);

  const reloadData = useCallback(
    async (showConnecting: boolean) => {
      // Load notifications
      await loadSavedNotificationMessagesToContext();
      if (!webviewClientConnected) {
        console.log("Not connected, can't reload");
        return;
      }
      isReconnecting = true;
      if (showConnecting) {
        setReconnecting(true);
      }
      const now = new Date().getTime();
      const diff = now - lastRetryAt;
      lastRetryAt = now;
      if (diff < 1000) {
        // Throttle the reloading
        await new Promise((r) => setTimeout(r, 1000 - diff));
      }
      console.log("RELOADING DATA");
      webviewReadyForMessages = false;
      setResyncing(true);
      const knownTopics = Object.keys(conversations);
      sendMessageToWebview("RELOAD", {
        lastSyncedAt: useChatStore.getState().lastSyncedAt,
        knownTopics,
      });
    },
    [setReconnecting, setResyncing, conversations, webviewClientConnected]
  );

  const isInternetReachableRef = useRef(isInternetReachable);

  useEffect(() => {
    if (!isInternetReachableRef.current && isInternetReachable) {
      // We're back online!
      reloadData(true);
    }
    isInternetReachableRef.current = isInternetReachable;
  }, [reloadData, isInternetReachable]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active" &&
          initialLoadDone
        ) {
          console.log("App is active, reloading data");
          reloadData(false);
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [reloadData, initialLoadDone]);

  const launchedInitialLoad = useRef(false);

  useEffect(() => {
    if (!webviewClientConnected) {
      launchedInitialLoad.current = false;
    }
  }, [webviewClientConnected]);

  useEffect(() => {
    const initialLoad = async () => {
      if (webviewClientConnected && !launchedInitialLoad.current) {
        launchedInitialLoad.current = true;
        // Let's launch the initial load of all convos & messages
        const knownTopics = Object.keys(conversations);
        sendMessageToWebview("LOAD_CONVERSATIONS_AND_MESSAGES", {
          lastSyncedAt: useChatStore.getState().lastSyncedAt,
          knownTopics,
        });
      }
    };
    initialLoad();
  }, [webviewClientConnected, conversations]);

  const onMessage = useCallback(
    async (e: WebViewMessageEvent) => {
      const { eventName, data } = JSON.parse(e.nativeEvent.data);
      if (data?.taskId) {
        const callback = tasksCallbacks[data.taskId];
        delete tasksCallbacks[data.taskId];
        if (callback) {
          callback(data);
        }
      }
      switch (eventName) {
        case "PONG":
          webviewReadyForMessages = true;
          break;
        case "SAVE_KEYS": {
          const { keys } = data;
          await saveXmtpKeys(keys);
          break;
        }
        case "XMTP_CONVERSATIONS":
          // TODO => handle multiple accounts here
          saveConversations(currentAccount, data);
          break;
        case "XMTP_EXPORTED_CONVERSATIONS":
          if (userAddress) {
            try {
              await saveXmtpConversations(userAddress, data);
            } catch (e) {
              console.log(e);
            }
          }

          break;
        case "XMTP_NEW_CONVERSATION": {
          saveConversations(currentAccount, [data]);
          // New conversation, let's subscribe to topic
          if (notificationsPermissionStatus === "granted" && userAddress) {
            subscribeToNotifications(
              userAddress,
              Object.values(conversations),
              blockedPeers
            );
          }
          break;
        }
        case "XMTP_MESSAGES":
          data.forEach((messagesFromConversation: any) => {
            gotMessagesFromNetwork(messagesFromConversation.messages.length);
            saveMessages(
              currentAccount,
              messagesFromConversation.messages,
              messagesFromConversation.topic
            );
          });
          break;
        case "XMTP_ADDRESS":
          setUserAddress(data.address);
          // If we receive this from webview, we're necessary
          // connected to the XMTP network!
          setWebviewClientConnected(true);
          break;
        case "WEB3_CONNECTED":
          web3Connected.current = true;
          break;
        case "XMTP_INITIAL_LOAD":
          useChatStore.getState().setLastSyncedAt(data.newLastSyncedAt);
          setInitialLoadDone();
          setReconnecting(false);
          break;
        case "XMTP_RELOAD_DONE": {
          useChatStore.getState().setLastSyncedAt(data.newLastSyncedAt);
          setResyncing(false);
          setReconnecting(false);
          if (notificationsPermissionStatus === "granted" && userAddress) {
            subscribeToNotifications(
              userAddress,
              Object.values(conversations),
              blockedPeers
            );
          }
          isReconnecting = false;
          break;
        }
        case "CANT_CREATE_CONVO": {
          Alert.alert("Could not create new conversation", data.error);
          break;
        }

        case "WEBVIEW_ERROR": {
          sentryTrackMessage("WEBVIEW_ERROR", data);
          break;
        }

        case "WEBVIEW_UNHANDLED_REJECTION": {
          isReconnecting = false;
          sentryTrackMessage("WEBVIEW_UNHANDLED_REJECTION", data);
          break;
        }

        case "ERROR_WHILE_RESYNCINC": {
          isReconnecting = false;
          console.log("ERROR_WHILE_RESYNCINC", data);
          sentryTrackMessage("ERROR_WHILE_RESYNCINC", data);
          reloadData(true);
          break;
        }

        case "ERROR_WHILE_SYNCINC": {
          isReconnecting = false;
          console.log("ERROR_WHILE_SYNCINC", data);
          sentryTrackMessage("ERROR_WHILE_SYNCINC", data);
          reloadData(true);
          break;
        }

        case "XMTP_CONNECTION_LOST": {
          if (!isReconnecting) {
            console.log("Xmtp Connection Lost, trying to reload");
            reloadData(true);
          }
          break;
        }

        case "CREATE_CONVERSATION_FAILED": {
          console.log("CREATE_CONVERSATION_FAILED", data);
          sentryTrackMessage("CREATE_CONVERSATION_FAILED", data);
          // Alert.alert(
          //   "Network error",
          //   lastCreateConvoFromNewConvoScreen
          //     ? "We could not create your conversation on the network. Please try again later"
          //     : "We could not create your conversation on the network. Please try again later or try typing the address in the “Create conversation” screen.",
          //   [
          //     {
          //       text: "OK",
          //       onPress: lastNavigation && lastNavigation.goBack,
          //       isPreferred: true,
          //     },
          //   ]
          // );
          break;
        }

        case "ERROR_WHILE_INSTANTIATING_CLIENT": {
          console.log("Retying to connect in 3 second...");
          await new Promise((r) => setTimeout(r, 3000));
          loadKeys();

          break;
        }

        default:
          break;
      }
      console.log(
        `[Expo  ⬅️   Webview]: ${eventName}`,
        (!hideDataFromEvents.includes(eventName) && data) || ""
      );
    },
    [
      currentAccount,
      blockedPeers,
      loadKeys,
      notificationsPermissionStatus,
      reloadData,
      setInitialLoadDone,
      setResyncing,
      setUserAddress,
      setWebviewClientConnected,
      conversations,
      userAddress,
      setReconnecting,
    ]
  );

  const localWebview =
    Platform.OS === "android" ? "file:///android_asset/xmtp.html" : "xmtp.html";

  const webviewToRender = (
    <WebView
      style={[styles.webview]}
      autoManageStatusBarEnabled={false}
      onMessage={onMessage}
      ref={(ref) => {
        webview = ref;
      }}
      source={{
        uri: localWebview,
      }}
      javaScriptEnabled
      originWhitelist={["*"]}
      allowFileAccess
    />
  );

  return (
    <View style={{ height: 1, position: "absolute", opacity: 0 }}>
      <SafeAreaProvider>{webviewToRender}</SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    position: "absolute",
    opacity: 0,
  },
});
