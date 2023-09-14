import { PrivateKey, decrypt } from "eciesjs";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, useColorScheme, Text, Platform } from "react-native";

import { clearDB } from "../../data/db";
import { useAccountsStore } from "../../data/store/accountsStore";
import { useOnboardingStore } from "../../data/store/onboardingStore";
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
import { saveXmtpKey } from "../../utils/keychain";
import { pick } from "../../utils/objects";
import {
  getXmtpClient,
  getXmtpClientFromBase64Key,
} from "../../utils/xmtpRN/client";
import OnboardingComponent from "./OnboardingComponent";

export default function DesktopConnect() {
  const { desktopConnectSessionId, setDesktopConnectSessionId } =
    useOnboardingStore((s) =>
      pick(s, ["desktopConnectSessionId", "setDesktopConnectSessionId"])
    );
  const styles = useStyles();
  const [localState, setLocalState] = useState({
    privateKey: "",
    publicKey: "",
    otp: "",
    subtitle: "Connecting" as string | React.ReactNode,
    showOtp: false,
    loading: true,
  });
  useEffect(() => {
    if (!desktopConnectSessionId) return;
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
      sessionId: desktopConnectSessionId,
    });
  }, [desktopConnectSessionId]);

  const inDesktopConnectInterval = useRef(false);
  const desktopConnectInterval = useCallback(async () => {
    if (!desktopConnectSessionId || inDesktopConnectInterval.current) return;
    inDesktopConnectInterval.current = true;
    try {
      const fetchedKey = await fetchDesktopSessionXmtpKey({
        sessionId: desktopConnectSessionId,
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
        const encryptedKeyBuffer = Buffer.from(fetchedKey, "base64");
        const decryptedKeyBuffer = decrypt(
          localState.privateKey,
          encryptedKeyBuffer
        );
        const base64Key = decryptedKeyBuffer.toString("base64");
        markDesktopSessionDone({
          sessionId: desktopConnectSessionId,
          otp: localState.otp,
          publicKey: localState.publicKey,
        });
        const client = await getXmtpClientFromBase64Key(base64Key);
        if (client && client.address) {
          // Successfull login for user, let's setup
          // the storage !
          await saveXmtpKey(client.address, base64Key);
          await clearDB(client.address);
          useAccountsStore.getState().setCurrentAccount(client.address);
          // Now we can instantiate the XMTP Client
          getXmtpClient(client.address);
        } else {
          inDesktopConnectInterval.current = false;
          throw new Error("COULD_NOT_INSTANTIATE_XMTP_CLIENT");
        }
      } else {
        inDesktopConnectInterval.current = false;
      }
    } catch (e: any) {
      console.log(e);
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
      inDesktopConnectInterval.current = false;
    }
  }, [
    desktopConnectSessionId,
    localState.otp,
    localState.privateKey,
    localState.publicKey,
    styles.clickableText,
  ]);

  useEffect(() => {
    if (!localState.privateKey) return;
    const interval = setInterval(desktopConnectInterval, 1000);
    return () => clearInterval(interval);
  }, [desktopConnectInterval, localState.privateKey]);

  return (
    <OnboardingComponent
      picto="lock.open.laptopcomputer"
      title="Desktop Connect"
      loading={localState.loading}
      subtitle={localState.subtitle}
      backButtonAction={() => {
        setDesktopConnectSessionId(null);
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

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
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
};
