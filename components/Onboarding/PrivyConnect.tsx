import { translate } from "@i18n";
import { useEmbeddedWallet, useLoginWithSMS, usePrivy } from "@privy-io/expo";
import {
  backgroundColor,
  primaryColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { PictoSizes } from "@styles/sizes";
import * as LibPhoneNumber from "libphonenumber-js";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { CountryCode } from "react-native-country-picker-modal";
import * as RNLocalize from "react-native-localize";
import { OtpInput, OtpInputRef } from "react-native-otp-entry";
import PhoneInput from "react-native-phone-number-input";

import OnboardingComponent from "./OnboardingComponent";
import ValueProps from "./ValueProps";
import { useOnboardingStore } from "../../data/store/onboardingStore";
import { useSelect } from "../../data/store/storeHelpers";
import { usePrivyAccessToken, usePrivySigner } from "../../utils/evm/privy";
import Button from "../Button/Button";
import Picto from "../Picto/Picto";

export default function PrivyConnect() {
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const {
    setLoading,
    setSigner,
    privyAccountId,
    setPrivyAccountId,
    setStep,
    resetOnboarding,
  } = useOnboardingStore(
    useSelect([
      "setLoading",
      "setSigner",
      "privyAccountId",
      "setPrivyAccountId",
      "setStep",
      "resetOnboarding",
    ])
  );

  const { isReady: privyReady, user: privyUser, logout } = usePrivy();

  useEffect(() => {
    setPrivyAccountId(undefined);
    logout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const embeddedWallet = useEmbeddedWallet();
  const privySigner = usePrivySigner(true);
  const privyAccessToken = usePrivyAccessToken();

  const { sendCode, loginWithCode } = useLoginWithSMS();

  const otpInputRef = useRef<OtpInputRef>();
  const phoneInputRef = useRef<PhoneInput>(null);

  const [status, setStatus] = useState<"enter-phone" | "verify-phone">(
    "enter-phone"
  );

  const [retrySeconds, setRetrySeconds] = useState(0);
  useEffect(() => {
    const i = setInterval(() => {
      setRetrySeconds((s) => {
        if (s > 0) {
          return s - 1;
        }
        return s;
      });
    }, 1000);
    return () => clearInterval(i);
  }, []);

  const [formattedPhone, setFormattedPhone] = useState("");
  const [beautifulPhone, setBeautifulPhone] = useState("");

  const sendPhone = useCallback(async () => {
    const parsed = LibPhoneNumber.parsePhoneNumberFromString(formattedPhone);
    if (!parsed?.isValid()) {
      Alert.alert(translate("privyConnect.errors.invalidPhoneNumber"));
      return;
    }
    setLoading(true);
    setBeautifulPhone(parsed.formatInternational());
    await sendCode({ phone: parsed.number });
    setStatus("verify-phone");
    setRetrySeconds(60);
    setLoading(false);
  }, [formattedPhone, sendCode, setLoading]);

  const submitCode = useCallback(
    async (otpCode: string) => {
      setLoading(true);
      const user = await loginWithCode({ code: otpCode });
      if (!user) {
        setLoading(false);
        Alert.alert(translate("privyConnect.errors.invalidCode"));
        otpInputRef.current?.clear();
      } else {
        setPrivyAccountId(user.id);
      }
    },
    [loginWithCode, setLoading, setPrivyAccountId]
  );

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
        await embeddedWallet.create();
      }
    };
    createWallet();
  }, [embeddedWallet, privyReady, privyUser]);

  const gotEmbeddedWallet = useRef(false);
  useEffect(() => {
    (async () => {
      if (
        privySigner &&
        privyAccessToken &&
        privyAccountId &&
        status === "verify-phone" &&
        !gotEmbeddedWallet.current
      ) {
        gotEmbeddedWallet.current = true;
        setSigner(privySigner);
      }
    })();
  }, [
    privyAccessToken,
    privyAccountId,
    privySigner,
    setLoading,
    setSigner,
    setStep,
    status,
  ]);

  const [showOtpTick, setShowOtpTick] = useState(true);

  useEffect(() => {
    const keyboardWillShowListened = Keyboard.addListener(
      "keyboardWillShow",
      () => {
        setShowOtpTick(true);
      }
    );
    const keyboardWillHideListener = Keyboard.addListener(
      "keyboardWillHide",
      () => {
        setShowOtpTick(false);
      }
    );

    const keyboardDidShowListened = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setShowOtpTick(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setShowOtpTick(false);
      }
    );

    return () => {
      keyboardWillShowListened.remove();
      keyboardWillHideListener.remove();
      keyboardDidShowListened.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <OnboardingComponent
      title={
        status === "enter-phone"
          ? translate("privyConnect.title.enterPhone")
          : translate("privyConnect.title.verifyPhone")
      }
      picto={status === "enter-phone" ? "phone" : "checkmark.circle"}
      primaryButtonText={
        status === "enter-phone"
          ? translate("privyConnect.buttons.continue")
          : undefined
      }
      primaryButtonAction={sendPhone}
      backButtonText={translate("privyConnect.buttons.back")}
      backButtonAction={resetOnboarding}
      shrinkWithKeyboard
      showTerms
    >
      {status === "enter-phone" && (
        <>
          <ValueProps />
          <PhoneInput
            ref={phoneInputRef}
            defaultCode={RNLocalize.getCountry() as CountryCode}
            layout="first"
            formatter={(t) => {
              const countryCode = phoneInputRef.current?.getCountryCode();
              const callingCode = phoneInputRef.current?.getCallingCode();
              if (!countryCode || !callingCode) return t;

              const formatter = new LibPhoneNumber.AsYouType(
                countryCode as LibPhoneNumber.CountryCode
              );

              const formatted = formatter.input(`+${callingCode}${t}`);
              const result = formatted.slice(callingCode.length + 1).trim();
              return result;
            }}
            onChangeFormattedText={(text) => {
              setFormattedPhone(text);
            }}
            withDarkTheme={colorScheme === "dark"}
            autoFocus
            countryPickerProps={{
              flatListProps: { style: styles.countryPicker },
              withFilter: true,
              // Disabling because causes crashes on some iPhones
              // filterProps: { autoFocus: true },
            }}
            containerStyle={styles.phoneInputContainer}
            flagButtonStyle={styles.flagButton}
            textContainerStyle={styles.phoneInput}
            textInputStyle={styles.phoneInputText}
            textInputProps={{
              placeholderTextColor: textSecondaryColor(colorScheme),
              selectionColor: textPrimaryColor(colorScheme),
              placeholder: translate("privyConnect.phoneInput.placeholder"),
              style: {
                color: textPrimaryColor(colorScheme),
              },
            }}
            codeTextStyle={{ display: "none" }}
            renderDropdownImage={
              <>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    alignItems: "center",
                  }}
                >
                  <Text style={styles.phoneCountryCode}>
                    +
                    {phoneInputRef.current?.getCallingCode() ||
                      phoneInputRef.current?.getCountryCode()}
                  </Text>
                  <Picto
                    picto="chevron.down"
                    color={textSecondaryColor(colorScheme)}
                    size={PictoSizes.privyConnect}
                    style={styles.flagChevron}
                  />
                </View>
              </>
            }
            // @ts-ignore
            flagSize={20}
          />
          <Text style={styles.p}>
            {translate("privyConnect.storedSecurely")}
          </Text>
        </>
      )}
      {status === "verify-phone" && (
        <>
          <Text style={styles.text}>
            {translate("privyConnect.otpInput.enterCode")}
          </Text>
          <Text style={[styles.text, { fontWeight: "600" }]}>
            {beautifulPhone}
          </Text>
          <OtpInput
            numberOfDigits={6}
            onFilled={(text) => {
              if (text.length === 6) {
                submitCode(text);
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
          <Button
            style={{ marginTop: 16 }}
            textStyle={{
              fontSize: 15,
              color:
                retrySeconds > 0
                  ? textSecondaryColor(colorScheme)
                  : primaryColor(colorScheme),
            }}
            variant="text"
            title={
              retrySeconds > 0
                ? translate("privyConnect.resendCodeIn", {
                    seconds: retrySeconds,
                  })
                : translate("privyConnect.buttons.resendCode")
            }
            onPress={() => {
              if (retrySeconds > 0) return;
              sendPhone();
            }}
          />
        </>
      )}
    </OnboardingComponent>
  );
}

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
    p: {
      textAlign: "center",
      marginLeft: 32,
      marginRight: 32,
      ...Platform.select({
        default: {
          fontSize: 13,
          lineHeight: 17,
          color: textPrimaryColor(colorScheme),
        },
        android: {
          fontSize: 14,
          lineHeight: 20,
          color: textPrimaryColor(colorScheme),
          maxWidth: 260,
        },
      }),
    },
    phoneInputContainer: {
      marginTop: 6,
      borderColor: textSecondaryColor(colorScheme),
      borderWidth: 1,
      borderRadius: 8,
      paddingLeft: 12,
      marginBottom: 8,
      backgroundColor: backgroundColor(colorScheme),
    },
    phoneInput: {
      backgroundColor: "transparent",
      left: 0,
    },
    phoneInputText: {
      height: 20,
      color: textPrimaryColor(colorScheme),
    },
    phoneCountryCode: {
      height: Platform.OS === "android" ? undefined : 20,
      color: textSecondaryColor(colorScheme),
      marginRight: 5,
      right: 8,
      top: 1,
    },
    flagButton: {
      flexDirection: "row",
      justifyContent: "flex-start",
    },
    flagChevron: {
      marginLeft: Platform.OS === "android" ? -5 : undefined,
    },
    countryPicker: {
      paddingLeft: 12,
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
