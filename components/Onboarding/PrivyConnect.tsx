import { useLoginWithSMS, useEmbeddedWallet, usePrivy } from "@privy-io/expo";
import * as LibPhoneNumber from "libphonenumber-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, useColorScheme, View } from "react-native";
import { CountryCode } from "react-native-country-picker-modal";
import * as RNLocalize from "react-native-localize";
import OtpInputs, { OtpInputsRef } from "react-native-otp-inputs";
import PhoneInput from "react-native-phone-number-input";

import Button from "../Button/Button";

export default function PrivyConnect() {
  const colorScheme = useColorScheme();
  const styles = useStyles();

  const { isReady: privyReady, user: privyUser } = usePrivy();
  const embeddedWallet = useEmbeddedWallet();

  const { sendCode, loginWithCode } = useLoginWithSMS();

  const otpInputRef = useRef<OtpInputsRef>();
  const phoneInputRef = useRef<PhoneInput>(null);

  const [status, setStatus] = useState<{
    step: "enter-phone" | "verify-phone" | "logged-in";
    loading: boolean;
  }>({
    step: "enter-phone",
    loading: false,
  });

  const [phone, setPhone] = useState("");
  const [formattedPhone, setFormattedPhone] = useState("");
  const otpCode = useRef("");

  const sendPhone = useCallback(async () => {
    const parsed = LibPhoneNumber.parsePhoneNumberFromString(formattedPhone);
    if (!parsed?.isValid) {
      Alert.alert("Invalid number");
      return;
    }
    setStatus((s) => ({ step: s.step, loading: true }));
    await sendCode({ phone: parsed.number });
    setStatus({ step: "verify-phone", loading: false });
  }, [formattedPhone, sendCode]);

  const submitCode = useCallback(async () => {
    if (otpCode.current.length !== 6) {
      Alert.alert("Invalid code");
      return;
    }
    setStatus((s) => ({ step: s.step, loading: true }));
    const user = await loginWithCode({ code: otpCode.current });
    if (user) {
      setStatus({ step: "logged-in", loading: true });
    } else {
      Alert.alert("Error occurred");
    }
  }, [loginWithCode, otpCode]);

  const creatingEmbeddedWallet = useRef(false);

  useEffect(() => {
    const createWallet = async () => {
      if (
        privyUser &&
        embeddedWallet.status === "not-created" &&
        privyReady &&
        !creatingEmbeddedWallet.current
      ) {
        creatingEmbeddedWallet.current = true;
        console.log("creating embedded wallet !!!");
        await embeddedWallet.create();
      }
    };
    createWallet();
  }, [embeddedWallet, privyReady, privyUser]);

  return (
    <View>
      {status.step === "enter-phone" && (
        <>
          <PhoneInput
            ref={phoneInputRef}
            defaultValue={phone}
            defaultCode={RNLocalize.getCountry() as CountryCode}
            layout="first"
            onChangeText={(text) => {
              setPhone(text);
            }}
            onChangeFormattedText={(text) => {
              setFormattedPhone(text);
            }}
            withDarkTheme={colorScheme === "dark"}
            autoFocus
            countryPickerProps={{ modalProps: { style: styles.countryPicker } }}
          />
          <Button variant="primary" onPress={sendPhone} title="Validate" />
        </>
      )}
      {status.step === "verify-phone" && (
        <>
          <OtpInputs
            autofillFromClipboard={false}
            handleChange={(code) => {
              otpCode.current = code;
              if (code.length === 6) {
                submitCode();
              }
            }}
            numberOfInputs={6}
            ref={(r) => {
              if (r) {
                otpInputRef.current = r;
              }
            }}
            // style={styles.otp}
            keyboardType="phone-pad"
            inputStyles={styles.otpInput}
            style={styles.otp}
          />
          <Button variant="primary" onPress={submitCode} title="Validate" />
        </>
      )}
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    countryPicker: {
      backgroundColor: "red",
    },
    otp: {
      flex: 1,
      flexDirection: "row",
      flexGrow: 0,
      marginVertical: 20,
    },

    otpInput: {
      width: 25,
      borderRadius: 3,
      textAlign: "center",
      borderColor: "grey",
      borderWidth: 1,
      height: 30,
      marginRight: 10,
    },
  });
};
