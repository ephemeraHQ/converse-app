import { textPrimaryColor, textSecondaryColor } from "@styles/colors";
import { formatPhoneNumberToBeautifulFormat } from "@utils/phone";
import React, { memo, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  useColorScheme,
} from "react-native";
import { OtpInput, OtpInputRef } from "react-native-otp-entry";

import { ResendCodeButton } from "./PrivyResendCodeButton";
import { usePrivyConnectStore } from "./privyAuthStore";
import { usePrivySmsLogin } from "./usePrivySmsLogin";
import { translate } from "../../../i18n";

export const PrivyPhoneVerification = memo(() => {
  const styles = useStyles();
  const colorScheme = useColorScheme();
  const otpInputRef = useRef<OtpInputRef>();
  const [showOtpTick, setShowOtpTick] = useState(true);
  const { loginWithCode, sendCode } = usePrivySmsLogin();
  const { phone, setOtpCode } = usePrivyConnectStore();
  const beautifulPhone = formatPhoneNumberToBeautifulFormat(phone);

  useEffect(() => {
    const keyboardListeners = [
      Keyboard.addListener("keyboardWillShow", () => setShowOtpTick(true)),
      Keyboard.addListener("keyboardWillHide", () => setShowOtpTick(false)),
      Keyboard.addListener("keyboardDidShow", () => setShowOtpTick(true)),
      Keyboard.addListener("keyboardDidHide", () => setShowOtpTick(false)),
    ];

    return () => {
      keyboardListeners.forEach((listener) => listener.remove());
    };
  }, []);

  return (
    <>
      <Text style={styles.text}>
        {translate("privyConnect.otpInput.enterCode")}
      </Text>
      <Text style={[styles.text, { fontWeight: "600" }]}>{beautifulPhone}</Text>
      <OtpInput
        numberOfDigits={6}
        onFilled={(text) => {
          setOtpCode(text);
          if (text.length === 6) {
            loginWithCode();
          }
        }}
        ref={(r) => {
          if (r) {
            otpInputRef.current = r;
          }
        }}
        hideStick={!showOtpTick}
        focusColor={textSecondaryColor(colorScheme)}
        theme={{
          containerStyle: styles.otp,
          focusStickStyle: styles.otpFocus,
          pinCodeContainerStyle: styles.otpInput,
          pinCodeTextStyle: styles.otpText,
        }}
      />
      <ResendCodeButton onPress={sendCode} />
    </>
  );
});

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    text: {
      fontSize: 16,
      lineHeight: 20,
      marginTop: 8,
      marginHorizontal: 50,
      textAlign: "center",
      color:
        Platform.OS === "android"
          ? textSecondaryColor(colorScheme)
          : textPrimaryColor(colorScheme),
    },
    otp: {
      paddingHorizontal: 14,
      marginTop: 32,
    },
    otpFocus: {
      height: Platform.OS === "android" ? 25 : 18,
      width: 1.75,
    },
    otpText: {
      fontSize: 24,
      color: textPrimaryColor(colorScheme),
      fontWeight: "600",
    },
    otpInput: {
      borderRadius: 8,
      borderWidth: 1,
      borderColor: textSecondaryColor(colorScheme),
      minWidth: 51,
    },
  });
};
