import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { StyleSheet, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { AppContext } from "../store/context";
import { DispatchTypes } from "../store/reducers";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const XMTP_WEBSITE_URI =
  "https://xmtp-native-webview.vercel.app";

let webview: WebView | null;
let webviewReadyForMessages = false;

const hideDataFromEvents = ["XMTP_MESSAGES", "SAVE_KEYS", "KEYS_LOADED"];

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

export const sendMessageToPeer = (peerAddress: string, content: string) => {
  sendMessageToWebview("SEND_MESSAGE", { peerAddress, content });
};

export default function XmtpWebview() {
  const [webviewKey, setWebviewKey] = useState(new Date().getTime());
  const loadedKeys = useRef(false);

  const { state, dispatch } = useContext(AppContext);

  useEffect(() => {
    let messagesReadyInterval: any;
    messagesReadyInterval = setInterval(() => {
      if (!webviewReadyForMessages) {
        sendMessageToWebview("PING");
      } else {
        clearInterval(messagesReadyInterval);
      }
    }, 100);
  }, []);

  useEffect(() => {
    const loadKeys = async () => {
      const keys = await SecureStore.getItemAsync("XMTP_KEYS");
      sendMessageToWebview("KEYS_LOADED", { keys });
      loadedKeys.current = true;
    };
    if (!loadedKeys.current) {
      loadKeys();
    }
  }, []);

  const onMessage = useCallback(async (e: WebViewMessageEvent) => {
    const { eventName, data } = JSON.parse(e.nativeEvent.data);
    switch (eventName) {
      case "PONG":
        webviewReadyForMessages = true;
        break;
      case "SAVE_KEYS":
        const { keys } = data;
        await SecureStore.setItemAsync("XMTP_KEYS", keys);
        break;
      case "XMTP_READY":
        dispatch({
          type: DispatchTypes.XmtpConnected,
          payload: { connected: true },
        });
        break;
      case "DISCONNECTED":
        dispatch({
          type: DispatchTypes.XmtpConnected,
          payload: { connected: false },
        });
        await SecureStore.deleteItemAsync("XMTP_KEYS");
        break;
      case "LOADED":
        dispatch({
          type: DispatchTypes.XmtpWebviewLoaded,
          payload: { loaded: true },
        });
        break;
      case "XMTP_CONVERSATIONS":
        dispatch({
          type: DispatchTypes.XmtpSetConversations,
          payload: {
            conversations: data,
          },
        });
        break;
      case "XMTP_MESSAGES":
        dispatch({
          type: DispatchTypes.XmtpSetMessages,
          payload: {
            peerAddress: data.peerAddress,
            messages: data.messages,
          },
        });
        break;
      case "XMTP_ADDRESS":
        dispatch({
          type: DispatchTypes.XmtpSetAddress,
          payload: {
            address: data.address,
          },
        });
        break;
      case "XMTP_NEW_MESSAGE":
        dispatch({
          type: DispatchTypes.XmtpNewMessage,
          payload: { peerAddress: data.peerAddress, message: data.message },
        });
        break;

      default:
        break;
    }
    console.log(
      `[Expo  ⬅️   Webview]: ${eventName}`,
      (!hideDataFromEvents.includes(eventName) && data) || ""
    );
  }, []);

  return (
    <View
      style={
        state.xmtp.webviewLoaded && !state.xmtp.connected
          ? styles.showWebView
          : null
      }
    >
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, borderWidth: 1 }}>
          <WebView
            style={[
              styles.webview,
              state.xmtp.webviewLoaded && !state.xmtp.connected
                ? styles.showWebView
                : null,
            ]}
            source={{
              uri: XMTP_WEBSITE_URI,
            }}
            javaScriptEnabled={true}
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
              if (r.url.startsWith("http") || r.url.startsWith("data:")) {
                return true;
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
        </SafeAreaView>
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 0,
    height: 0,
  },
  showWebView: {
    flex: 1,
  },
});
