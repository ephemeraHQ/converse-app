import {
  buildUserInviteTopic,
  buildUserIntroTopic,
  //@ts-ignore
} from "@xmtp/xmtp-js/dist/cjs/src/utils";
import React, { useCallback, useContext, useEffect, useRef } from "react";
import { Alert, AppState, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { WebView, WebViewMessageEvent } from "react-native-webview";

import config from "../config";
import { saveNewConversation, saveConversations, saveMessages } from "../data";
import { AppContext } from "../data/store/context";
import { XmtpDispatchTypes } from "../data/store/xmtpReducer";
import {
  deleteXmtpKeys,
  loadXmtpKeys,
  saveXmtpConversations,
  saveXmtpKeys,
} from "../utils/keychain";
import { lastValueInMap } from "../utils/map";
import {
  loadSavedNotificationMessagesToContext,
  subscribeToNotifications,
} from "../utils/notifications";
import { addLog } from "./DebugButton";

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

export const sendXmtpMessage = (topic: string, content: string) => {
  sendMessageToWebview("SEND_MESSAGE", { topic, content });
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
    if (!loadedKeys.current) {
      loadKeys();
    }

    return () => {
      webview = null;
      webviewReadyForMessages = false;
    };
  }, []);

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
          webviewReadyForMessages = false;
          dispatch({
            type: XmtpDispatchTypes.XmtpLoading,
            payload: { loading: true },
          });
          // Load notifications
          await loadSavedNotificationMessagesToContext(dispatch);
          const lastTimestampByConversation: { [topic: string]: number } = {};
          for (const topic in state.xmtp.conversations) {
            const conversation = state.xmtp.conversations[topic];
            lastTimestampByConversation[topic] =
              conversation.messages?.size > 0
                ? lastValueInMap(conversation.messages)?.sent || 0
                : 0;
          }
          sendMessageToWebview("RELOAD", lastTimestampByConversation);
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [dispatch, state.xmtp.conversations, state.xmtp.initialLoadDone]);

  const launchedInitialLoad = useRef(false);

  useEffect(() => {
    if (!state.xmtp.connected) {
      launchedInitialLoad.current = false;
    }
  }, [state.xmtp.connected]);

  useEffect(() => {
    if (state.xmtp.connected && !launchedInitialLoad.current) {
      // Let's launch the "initial load"
      // of messages starting with last
      // timestamp for each convo
      const lastTimestampByConversation: { [topic: string]: number } = {};
      for (const topic in state.xmtp.conversations) {
        const conversation = state.xmtp.conversations[topic];
        lastTimestampByConversation[topic] =
          conversation.messages?.size > 0
            ? lastValueInMap(conversation.messages)?.sent || 0
            : 0;
      }
      sendMessageToWebview(
        "LOAD_CONVERSATIONS_AND_MESSAGES",
        lastTimestampByConversation
      );
      launchedInitialLoad.current = true;
    }
  }, [state.xmtp.connected, state.xmtp.conversations]);

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
            type: XmtpDispatchTypes.XmtpConnected,
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
          if (state.notifications.status === "granted") {
            const topics = [
              ...Object.keys(state.xmtp.conversations),
              buildUserIntroTopic(state.xmtp.address || ""),
              buildUserInviteTopic(state.xmtp.address || ""),
            ];
            subscribeToNotifications(topics);
          }
          break;
        }
        case "XMTP_MESSAGES":
          saveMessages(data.messages, data.topic, dispatch);
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
            type: XmtpDispatchTypes.XmtpConnected,
            payload: { connected: true },
          });
          break;
        case "WEB3_CONNECTED":
          web3Connected.current = true;
          break;
        case "XMTP_INITIAL_LOAD":
          dispatch({
            type: XmtpDispatchTypes.XmtpInitialLoad,
          });
          break;
        case "XMTP_RELOAD_DONE": {
          dispatch({
            type: XmtpDispatchTypes.XmtpLoading,
            payload: { loading: false },
          });
          const topics = [
            ...Object.keys(state.xmtp.conversations),
            buildUserIntroTopic(state.xmtp.address || ""),
            buildUserInviteTopic(state.xmtp.address || ""),
          ];
          subscribeToNotifications(topics);
          break;
        }
        case "CANT_CREATE_CONVO": {
          Alert.alert("Could not create new conversation", data.error);
          break;
        }
        case "SEND_MESSAGE_ERROR": {
          addLog(`SEND_MESSAGE_ERROR: ${data}`);
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
      state.xmtp.conversations,
    ]
  );

  const showWebView = false;

  const webviewToRender = (
    <WebView
      style={[styles.webview, showWebView ? styles.showWebView : null]}
      autoManageStatusBarEnabled={false}
      onMessage={onMessage}
      ref={(ref) => {
        webview = ref;
      }}
      source={{
        uri: "xmtp.html",
      }}
      javaScriptEnabled
      originWhitelist={["*"]}
      allowFileAccess
    />
  );

  return (
    <View style={{ flex: showWebView ? 1 : 0 }}>
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
  showWebView: {
    position: "relative",
    opacity: 1,
  },
});
