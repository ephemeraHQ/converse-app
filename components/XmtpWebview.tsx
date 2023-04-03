import React, { useCallback, useContext, useEffect, useRef } from "react";
import { Alert, AppState, Platform, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { WebView, WebViewMessageEvent } from "react-native-webview";

import config from "../config";
import { saveNewConversation, saveConversations, saveMessages } from "../data";
import { AppContext } from "../data/store/context";
import { XmtpDispatchTypes } from "../data/store/xmtpReducer";
import { loadSavedNotificationMessagesToContext } from "../utils/backgroundNotifications/loadSavedNotifications";
import {
  deleteXmtpKeys,
  loadXmtpConversation,
  loadXmtpKeys,
  saveXmtpConversations,
  saveXmtpKeys,
} from "../utils/keychain";
import { getLastXMTPSyncedAt, saveLastXMTPSyncedAt } from "../utils/mmkv";
import { subscribeToNotifications } from "../utils/notifications";
import { sentryTrackMessage } from "../utils/sentry";

let webview: WebView | null;
let webviewReadyForMessages = false;

const hideDataFromEvents = [
  "XMTP_MESSAGES",
  "SAVE_KEYS",
  "KEYS_LOADED_FROM_SECURE_STORAGE",
  "XMTP_CONVERSATIONS",
  "RELOAD",
  "LOAD_CONVERSATIONS_AND_MESSAGES",
  "XMTP_EXPORTED_CONVERSATIONS",
];

export const sendMessageToWebview = (eventName: string, data?: any) => {
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
  webview.postMessage(JSON.stringify({ eventName, data }));
};

export default function XmtpWebview() {
  const appState = useRef(AppState.currentState);
  const loadedKeys = useRef(false);
  const web3Connected = useRef(false);

  const { state, dispatch } = useContext(AppContext);

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

  useEffect(() => {
    const loadKeys = async () => {
      const keys = await loadXmtpKeys();
      sendMessageToWebview("KEYS_LOADED_FROM_SECURE_STORAGE", {
        keys,
        env: config.xmtpEnv,
      });
      loadedKeys.current = true;
    };
    if (!loadedKeys.current && state.xmtp.address) {
      loadKeys();
    }
  }, [state.xmtp.address]);

  const reloadData = useCallback(async () => {
    webviewReadyForMessages = false;
    dispatch({
      type: XmtpDispatchTypes.XmtpLoading,
      payload: { loading: true },
    });
    // Load notifications
    await loadSavedNotificationMessagesToContext(dispatch);
    const knownTopics = Object.keys(state.xmtp.conversations);
    sendMessageToWebview("RELOAD", {
      lastSyncedAt: getLastXMTPSyncedAt(),
      knownTopics,
    });
  }, [dispatch, state.xmtp.conversations]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active" &&
          state.xmtp.initialLoadDone
        ) {
          console.log("App is active, reloading data");
          reloadData();
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [reloadData, state.xmtp.initialLoadDone]);

  const launchedInitialLoad = useRef(false);

  useEffect(() => {
    if (!state.xmtp.webviewConnected) {
      launchedInitialLoad.current = false;
    }
  }, [state.xmtp.webviewConnected]);

  useEffect(() => {
    const initialLoad = async () => {
      if (state.xmtp.webviewConnected && !launchedInitialLoad.current) {
        // Let's launch the initial load of all convos & messages
        const knownTopics = Object.keys(state.xmtp.conversations);
        const exportedConversations = await Promise.all(
          knownTopics.map(loadXmtpConversation)
        );
        sendMessageToWebview("LOAD_CONVERSATIONS_AND_MESSAGES", {
          lastSyncedAt: getLastXMTPSyncedAt(),
          knownTopics,
          exportedConversations,
        });
        launchedInitialLoad.current = true;
      }
    };
    initialLoad();
  }, [state.xmtp.webviewConnected, state.xmtp.conversations]);

  const onMessage = useCallback(
    async (e: WebViewMessageEvent) => {
      const { eventName, data } = JSON.parse(e.nativeEvent.data);
      switch (eventName) {
        case "PONG":
          webviewReadyForMessages = true;
          break;
        case "SAVE_KEYS": {
          const { keys } = data;
          await saveXmtpKeys(keys);
          break;
        }
        case "DISCONNECTED":
          dispatch({
            type: XmtpDispatchTypes.XmtpWebviewConnected,
            payload: { connected: false },
          });
          launchedInitialLoad.current = false;
          await deleteXmtpKeys();
          webview?.reload();
          break;
        case "XMTP_CONVERSATIONS":
          saveConversations(data, dispatch);
          break;
        case "XMTP_EXPORTED_CONVERSATIONS":
          if (state.xmtp.address) {
            try {
              await saveXmtpConversations(state.xmtp.address, data);
            } catch (e) {
              console.log(e);
            }
          }

          break;
        case "XMTP_NEW_CONVERSATION": {
          saveNewConversation(data, dispatch);
          // New conversation, let's subscribe to topic
          if (state.notifications.status === "granted" && state.xmtp.address) {
            subscribeToNotifications(
              state.xmtp.address,
              Object.values(state.xmtp.conversations),
              state.xmtp.blockedPeerAddresses
            );
          }
          break;
        }
        case "XMTP_MESSAGES":
          data.forEach((messagesFromConversation: any) => {
            saveMessages(
              messagesFromConversation.messages,
              messagesFromConversation.topic,
              dispatch
            );
          });
          break;
        case "XMTP_ADDRESS":
          dispatch({
            type: XmtpDispatchTypes.XmtpSetAddress,
            payload: {
              address: data.address,
            },
          });
          // If we receive this from webview, we're necessary
          // connected to the XMTP network!
          dispatch({
            type: XmtpDispatchTypes.XmtpWebviewConnected,
            payload: { connected: true },
          });
          break;
        case "WEB3_CONNECTED":
          web3Connected.current = true;
          break;
        case "XMTP_INITIAL_LOAD":
          saveLastXMTPSyncedAt(data.newLastSyncedAt);
          dispatch({
            type: XmtpDispatchTypes.XmtpInitialLoad,
          });
          break;
        case "XMTP_RELOAD_DONE": {
          saveLastXMTPSyncedAt(data.newLastSyncedAt);
          dispatch({
            type: XmtpDispatchTypes.XmtpLoading,
            payload: { loading: false },
          });
          if (state.notifications.status === "granted" && state.xmtp.address) {
            subscribeToNotifications(
              state.xmtp.address,
              Object.values(state.xmtp.conversations),
              state.xmtp.blockedPeerAddresses
            );
          }
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
          const IGNORED_REASONS = ["AbortError: Fetch is aborted"];
          if (IGNORED_REASONS.some((r) => r.includes(data.reason))) {
            console.log("Ignoring unhandled rejection");
          } else {
            sentryTrackMessage("WEBVIEW_UNHANDLED_REJECTION", data);
          }
          break;
        }

        case "ERROR_WHILE_RESYNCINC": {
          console.log("ERROR_WHILE_RESYNCINC", data);
          sentryTrackMessage("ERROR_WHILE_RESYNCINC", data);
          break;
        }

        case "ERROR_WHILE_SYNCINC": {
          console.log("ERROR_WHILE_SYNCINC", data);
          sentryTrackMessage("ERROR_WHILE_SYNCINC", data);
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
      dispatch,
      state.notifications.status,
      state.xmtp.address,
      state.xmtp.blockedPeerAddresses,
      state.xmtp.conversations,
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
