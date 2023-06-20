import { PrivateKey, decrypt } from "eciesjs";
import * as Linking from "expo-linking";
import { useContext, useEffect, useState } from "react";
import {
  ColorSchemeName,
  StyleSheet,
  useColorScheme,
  Text,
  Platform,
} from "react-native";

import config from "../../config";
import { clearDB } from "../../data/db";
import { AppDispatchTypes } from "../../data/store/appReducer";
import { AppContext } from "../../data/store/context";
import {
  fetchDesktopSessionXmtpKey,
  markDesktopSessionDone,
  openDesktopSession,
} from "../../utils/api";
import {
  primaryColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";
import { saveXmtpKeys } from "../../utils/keychain";
import { getXmtpClientFromKeys } from "../../utils/xmtp";
import { sendMessageToWebview } from "../XmtpWebview";
import OnboardingComponent from "./OnboardingComponent";

export default function DesktopConnect() {
  const { state, dispatch } = useContext(AppContext);
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const [localState, setLocalState] = useState({
    privateKey: "",
    publicKey: "",
    otp: "",
    subtitle: "Connecting" as string | React.ReactNode,
    showOtp: false,
    loading: true,
  });
  useEffect(() => {
    if (!state.app.desktopConnectSessionId) return;
    const privateKey = new PrivateKey();
    const publicKey = privateKey.publicKey.toHex();
    const otpNum = Math.floor(Math.random() * 1000000);
    const otp = otpNum.toString().padStart(6, "0");
    setLocalState({
      privateKey: privateKey.toHex(),
      publicKey,
      otp,
      subtitle: "Enter the code below on your desktop.",
      showOtp: true,
      loading: false,
    });
    openDesktopSession({
      publicKey,
      otp,
      sessionId: state.app.desktopConnectSessionId,
    });
  }, [state.app.desktopConnectSessionId]);
  useEffect(() => {
    if (!localState.privateKey) return;
    const interval = setInterval(async () => {
      if (!state.app.desktopConnectSessionId) return;
      try {
        const fetchedKey = await fetchDesktopSessionXmtpKey({
          sessionId: state.app.desktopConnectSessionId,
          otp: localState.otp,
          publicKey: localState.publicKey,
        });
        if (fetchedKey) {
          setLocalState((s) => ({
            ...s,
            subtitle: "Connecting to XMTP",
            loading: true,
            showOtp: false,
          }));
          clearInterval(interval);
          const encryptedKeyBuffer = Buffer.from(fetchedKey, "base64");
          const decryptedKeyBuffer = decrypt(
            localState.privateKey,
            encryptedKeyBuffer
          );
          const xmtpKeys = JSON.stringify(Array.from(decryptedKeyBuffer));
          markDesktopSessionDone({
            sessionId: state.app.desktopConnectSessionId,
            otp: localState.otp,
            publicKey: localState.publicKey,
          });
          const client = await getXmtpClientFromKeys(decryptedKeyBuffer);
          if (client && client.address) {
            saveXmtpKeys(xmtpKeys);

            await clearDB();
            sendMessageToWebview("KEYS_LOADED_FROM_SECURE_STORAGE", {
              keys: localState,
              env: config.xmtpEnv,
            });
          } else {
            throw new Error("COULD_NOT_INSTANTIATE_XMTP_CLIENT");
          }
        }
      } catch (e: any) {
        setLocalState((s) => ({
          ...s,
          subtitle: (
            <Text>
              There was an error. Please try again. If it keeps failing,{" "}
              <Text
                onPress={() => {
                  Linking.openURL("https://twitter.com/converseapp_");
                }}
                style={styles.clickableText}
              >
                ping us on Twitter
              </Text>
              .
            </Text>
          ),
          loading: false,
          showOtp: false,
        }));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [localState, state.app.desktopConnectSessionId, styles.clickableText]);

  return (
    <OnboardingComponent
      picto="lock.open.laptopcomputer"
      title="Desktop Connect"
      loading={localState.loading}
      subtitle={localState.subtitle}
      backButtonAction={() => {
        dispatch({
          type: AppDispatchTypes.AppSetDesktopConnectSessionId,
          payload: { sessionId: undefined },
        });
      }}
      backButtonText="Back to home screen"
      view={
        localState.showOtp && (
          <>
            <Text style={styles.otp}>{localState.otp}</Text>
            <Text style={styles.p}>
              By connecting your wallet you agree to our{" "}
              <Text
                style={styles.clickableText}
                onPress={() =>
                  Linking.openURL(
                    "https://converseapp.notion.site/Terms-and-conditions-004036ad55044aba888cc83e21b8cbdb"
                  )
                }
              >
                terms and conditions
              </Text>
              .
            </Text>
          </>
        )
      }
    />
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    otp: {
      fontSize: 34,
      fontWeight: "700",
      textAlign: "center",
      marginTop: 25,
      color: textPrimaryColor(colorScheme),
    },
    clickableText: {
      color: primaryColor(colorScheme),
    },
    p: {
      textAlign: "center",
      marginTop: 21,
      marginLeft: 32,
      marginRight: 32,
      ...Platform.select({
        default: {
          fontSize: 17,
          color: textPrimaryColor(colorScheme),
        },
        android: {
          fontSize: 14,
          lineHeight: 20,
          color: textSecondaryColor(colorScheme),
          maxWidth: 260,
        },
      }),
    },
  });
