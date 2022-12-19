import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { WebView, WebViewMessageEvent } from "react-native-webview";

import config from "../config";
import { saveNewConversation, saveConversations, saveMessages } from "../data";
import { AppContext } from "../data/store/context";
import { XmtpDispatchTypes } from "../data/store/xmtpReducer";
import { subscribeToNotifications } from "../utils/notifications";

const XMTP_WEBSITE_URI = config.xmtpWebviewURI;

let webview: WebView | null;
let webviewReadyForMessages = false;

const hideDataFromEvents = [
  "XMTP_MESSAGES",
  "SAVE_KEYS",
  "KEYS_LOADED_FROM_SECURE_STORAGE",
  "XMTP_CONVERSATIONS",
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
  const [webviewKey, setWebviewKey] = useState(new Date().getTime());
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
      const keys = await SecureStore.getItemAsync("XMTP_KEYS");
      sendMessageToWebview("KEYS_LOADED_FROM_SECURE_STORAGE", { keys });
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
    const subscription = AppState.addEventListener("change", (nextAppState) => {
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
        const lastTimestampByConversation: { [topic: string]: number } = {};
        for (const topic in state.xmtp.conversations) {
          const conversation = state.xmtp.conversations[topic];
          lastTimestampByConversation[topic] =
            conversation.messages?.[0]?.sent || 0;
        }
        sendMessageToWebview("RELOAD", lastTimestampByConversation);
      }
      appState.current = nextAppState;
    });

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
          conversation.messages?.[0]?.sent || 0;
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
          await SecureStore.setItemAsync("XMTP_KEYS", keys);
          break;
        }

        case "XMTP_READY":
          dispatch({
            type: XmtpDispatchTypes.XmtpConnected,
            payload: { connected: true },
          });
          break;
        case "DISCONNECTED":
          dispatch({
            type: XmtpDispatchTypes.XmtpConnected,
            payload: { connected: false },
          });
          launchedInitialLoad.current = false;
          await SecureStore.deleteItemAsync("XMTP_KEYS");
          webview?.reload();
          break;
        case "WEBVIEW_LOADED":
          dispatch({
            type: XmtpDispatchTypes.XmtpWebviewLoaded,
            payload: { loaded: true },
          });
          break;
        case "XMTP_CONVERSATIONS":
          saveConversations(data, dispatch);
          break;
        case "XMTP_NEW_CONVERSATION": {
          saveNewConversation(data, dispatch);
          // New conversation, let's subscribe to topic
          if (state.notifications.status === "granted") {
            const topics = Object.keys(state.xmtp.conversations);
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
          const topics = Object.keys(state.xmtp.conversations);
          subscribeToNotifications(topics);
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
    [dispatch, state.notifications.status, state.xmtp.conversations]
  );

  const showWebView = state.xmtp.webviewLoaded && !state.xmtp.connected;

  const webviewToRender = (
    <WebView
      style={[styles.webview, showWebView ? styles.showWebView : null]}
      source={{
        uri: `${XMTP_WEBSITE_URI}?xmtpEnv=${config.xmtpEnv}`,
      }}
      javaScriptEnabled
      key={webviewKey}
      originWhitelist={["*"]}
      onMessage={onMessage}
      scrollEnabled={false}
      ref={(ref) => {
        webview = ref;
      }}
      onShouldStartLoadWithRequest={(r) => {
        // Metamask fails when opening the link, we force a direct deeplink
        if (r.url.startsWith("https://metamask.app.link/")) {
          const urlEnd = decodeURIComponent(
            r.url.replace("https://metamask.app.link/", "")
          );
          const newUrl = `metamask://${urlEnd}`;
          Linking.openURL(newUrl);
          return false;
        }
        // Enable http(s) & data URIs
        if (r.url.startsWith("data:")) {
          return true;
        }
        if (r.url.startsWith("http")) {
          if (r.url.startsWith(XMTP_WEBSITE_URI)) {
            return true;
          } else {
            Linking.openURL(r.url);
            return false;
          }
        }
        // Forbid itunes store & blank uris
        if (
          r.url.startsWith("about:blank") ||
          r.url.startsWith("itms-apps://")
        ) {
          return false;
        }
        Linking.openURL(r.url);
        setWebviewKey(new Date().getTime());
        return false;
      }}
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
