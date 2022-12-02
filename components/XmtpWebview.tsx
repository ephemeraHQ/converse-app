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

const XMTP_WEBSITE_URI = "https://xmtp-native-webview.vercel.app";
// const XMTP_WEBSITE_URI = "https://813c-109-22-47-86.eu.ngrok.io";

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
  const web3Connected = useRef(false);

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
        webview?.reload();
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
      case "XMTP_NEW_CONVERSATION":
        dispatch({
          type: DispatchTypes.XmtpNewConversation,
          payload: {
            conversation: data,
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
      case "WEB3_CONNECTED":
        web3Connected.current = true;
        break;
      case "XMTP_INITIAL_LOAD":
        dispatch({
          type: DispatchTypes.XmtpInitialLoad,
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

  const showWebView = state.xmtp.webviewLoaded && !state.xmtp.connected;

  const webviewToRender = (
    <WebView
      style={[styles.webview, showWebView ? styles.showWebView : null]}
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
