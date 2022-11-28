import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { AppContext } from "../store/context";
import { DispatchTypes } from "../store/reducers";

const XMTP_WEBSITE_URI =
  "https://ea22-2a01-cb04-85e-2800-b563-a321-bb25-e33e.eu.ngrok.io";

let webview: WebView | null;
let webviewReadyForMessages = false;

export const sendMessageToWebview = (eventName: string, data?: any) => {
  if (!webview) {
    setTimeout(() => {
      console.log("Webview not live yet");
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
  console.log(`[Expo  ➡️   Webview]: ${eventName}`, data || "");
  webview.postMessage(JSON.stringify({ eventName, data }));
};

export default function XmtpWebview() {
  const [webviewLoaded, setWebviewLoaded] = useState(false);
  const [webviewKey, setWebviewKey] = useState(new Date().getTime());
  const loadedKeys = useRef(false);
  const [xmtpReady, setXmtpReady] = useState(false);

  const { dispatch } = useContext(AppContext);

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
        setXmtpReady(true);
        dispatch({
          type: DispatchTypes.XmtpConnected,
          payload: { connected: true },
        });
        break;
      case "LOADED":
        setWebviewLoaded(true);
        break;

      default:
        break;
    }
    console.log(`[Expo  ⬅️   Webview]: ${eventName}`, data || "");
  }, []);

  return (
    <WebView
      style={[
        styles.webview,
        webviewLoaded && !xmtpReady ? styles.showWebView : null,
      ]}
      source={{
        uri: XMTP_WEBSITE_URI,
      }}
      javaScriptEnabled={true}
      key={webviewKey}
      originWhitelist={["*"]}
      onMessage={onMessage}
      ref={(ref) => {
        webview = ref;
      }}
      onShouldStartLoadWithRequest={(r) => {
        if (r.url.startsWith("http") || r.url.startsWith("data:")) {
          return true;
        }
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
}

const styles = StyleSheet.create({
  webview: {
    flex: 0,
    height: 0,
  },
  showWebView: {
    // flex:1,
    borderWidth: 1,
    borderColor: "green",
    height: 400,
  },
});
