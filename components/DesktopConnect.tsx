import { PrivateKey, decrypt } from "eciesjs";
import { useContext, useEffect, useState } from "react";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import config from "../config";
import { clearDB } from "../data/db";
import { AppDispatchTypes } from "../data/store/appReducer";
import { AppContext } from "../data/store/context";
import {
  fetchDesktopSessionXmtpKey,
  markDesktopSessionDone,
  openDesktopSession,
} from "../utils/api";
import { saveXmtpKeys } from "../utils/keychain";
import ActivityIndicator from "./ActivityIndicator/ActivityIndicator";
import Button from "./Button/Button";
import { sendMessageToWebview } from "./XmtpWebview";

export default function DesktopConnect() {
  const { state, dispatch } = useContext(AppContext);
  const [keys, setKeys] = useState({
    privateKey: "",
    publicKey: "",
    otp: "",
  });
  useEffect(() => {
    if (!state.app.desktopConnectSessionId) return;
    console.log("Generating private key etc...");
    const privateKey = new PrivateKey();
    const publicKey = privateKey.publicKey.toHex();
    const otpNum = Math.floor(Math.random() * 1000000);
    const otp = otpNum.toString().padStart(6, "0");
    setKeys({ privateKey: privateKey.toHex(), publicKey, otp });
    console.log("done! opening session...");
    openDesktopSession({
      publicKey,
      otp,
      sessionId: state.app.desktopConnectSessionId,
    });
  }, [state.app.desktopConnectSessionId]);
  useEffect(() => {
    if (!keys.privateKey) return;
    const interval = setInterval(async () => {
      if (!state.app.desktopConnectSessionId) return;
      console.log("fetching the encrypted xmtp key...");
      const fetchedKey = await fetchDesktopSessionXmtpKey({
        sessionId: state.app.desktopConnectSessionId,
        otp: keys.otp,
        publicKey: keys.publicKey,
      });
      if (fetchedKey) {
        console.log("got encrypted xmtp key! decrypting");
        clearInterval(interval);
        const encryptedKeyBuffer = Buffer.from(fetchedKey, "base64");
        const decryptedKeyBuffer = decrypt(keys.privateKey, encryptedKeyBuffer);
        const xmtpKeys = JSON.stringify(Array.from(decryptedKeyBuffer));
        markDesktopSessionDone({
          sessionId: state.app.desktopConnectSessionId,
          otp: keys.otp,
          publicKey: keys.publicKey,
        });
        // ALL GOOD
        saveXmtpKeys(xmtpKeys);

        await clearDB();
        sendMessageToWebview("KEYS_LOADED_FROM_SECURE_STORAGE", {
          keys,
          env: config.xmtpEnv,
        });
        console.log("WE ALL GOOD");
      } else {
        console.log("no encrypted xmtp key yet");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [keys, state.app.desktopConnectSessionId]);
  return (
    <SafeAreaView>
      <Text>Welcome to desktop connect!</Text>
      {!keys.otp && <ActivityIndicator />}
      {keys.otp && <Text>Enter the following OTP: {keys.otp}</Text>}

      <Button
        variant="text"
        title="Back"
        onPress={() => {
          dispatch({
            type: AppDispatchTypes.AppSetDesktopConnectSessionId,
            payload: { sessionId: undefined },
          });
        }}
      />
    </SafeAreaView>
  );
}
