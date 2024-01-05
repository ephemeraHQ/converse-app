import { useLoginWithSMS, useEmbeddedWallet, usePrivy } from "@privy-io/expo";
import * as LibPhoneNumber from "libphonenumber-js";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  useColorScheme,
} from "react-native";
import { CountryCode } from "react-native-country-picker-modal";
import * as RNLocalize from "react-native-localize";
import { OtpInput, OtpInputRef } from "react-native-otp-entry";
import PhoneInput from "react-native-phone-number-input";

import Button from "../../components/Button/Button";
import { useOnboardingStore } from "../../data/store/onboardingStore";
import { useSelect } from "../../data/store/storeHelpers";
import {
  backgroundColor,
  primaryColor,
  tertiaryBackgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";
import { usePrivySigner } from "../../utils/evm/helpers";
import { addLog } from "../DebugButton";
import Picto from "../Picto/Picto";
import OnboardingComponent from "./OnboardingComponent";

export default function PrivyConnect() {
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const { setConnectionMethod, setLoading, setSigner, setPrivyAccountId } =
    useOnboardingStore(
      useSelect([
        "setConnectionMethod",
        "setLoading",
        "setSigner",
        "setPrivyAccountId",
      ])
    );

  const { isReady: privyReady, user: privyUser, logout } = usePrivy();

  useEffect(() => {
    setPrivyAccountId(undefined);
    addLog("Logging out from Privy from PrivyConnect page");
    logout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const embeddedWallet = useEmbeddedWallet();
  const privySigner = usePrivySigner(true);

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
      Alert.alert("Please enter a valid phone number");
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
        Alert.alert("The code you entered is not valid, please try again");
        otpInputRef.current?.clear();
      } else {
        setPrivyAccountId(user.user.id);
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
        status === "verify-phone" &&
        !gotEmbeddedWallet.current
      ) {
        gotEmbeddedWallet.current = true;
        setSigner(privySigner);
      }
    })();
  }, [privySigner, setSigner, status]);

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
      title={status === "enter-phone" ? "Phone number" : "Confirmation code"}
      picto="phone"
      primaryButtonText={status === "enter-phone" ? "Continue" : undefined}
      primaryButtonAction={sendPhone}
      backButtonText="Back to home screen"
      backButtonAction={() => {
        setConnectionMethod(undefined);
      }}
      shrinkWithKeyboard
    >
      {status === "enter-phone" && (
        <>
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
              filterProps: { autoFocus: true },
            }}
            containerStyle={styles.phoneInputContainer}
            flagButtonStyle={styles.flagButton}
            textContainerStyle={styles.phoneInput}
            textInputStyle={styles.phoneInputText}
            textInputProps={{
              placeholderTextColor: textSecondaryColor(colorScheme),
              selectionColor: textPrimaryColor(colorScheme),
            }}
            codeTextStyle={styles.phoneCountryCode}
            renderDropdownImage={
              <Picto
                picto="chevron.down"
                color={textSecondaryColor(colorScheme)}
                size={Platform.OS === "ios" ? 12 : 22}
                style={styles.flagChevron}
              />
            }
            // @ts-ignore
            flagSize={17}
          />
          <Text style={styles.text}>
            We need your phone number to identify you
          </Text>
        </>
      )}
      {status === "verify-phone" && (
        <>
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
          <Text style={styles.text}>
            Enter confirmation code sent to{"\n"}
            {beautifulPhone}
          </Text>
          <Button
            style={{ marginTop: 32 }}
            textStyle={{
              color:
                retrySeconds > 0
                  ? textSecondaryColor(colorScheme)
                  : primaryColor(colorScheme),
            }}
            variant="text"
            title={
              retrySeconds > 0
                ? `Resend code in ${retrySeconds} seconds...`
                : "Resend code"
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
      fontSize: 17,
      marginTop: 32,
      marginHorizontal: 50,
      textAlign: "center",
      color:
        Platform.OS === "android"
          ? textSecondaryColor(colorScheme)
          : textPrimaryColor(colorScheme),
    },
    phoneInputContainer: {
      marginTop: 32,
      backgroundColor: backgroundColor(colorScheme),
    },
    phoneInput: Platform.select({
      default: {
        backgroundColor: tertiaryBackgroundColor(colorScheme),
        borderRadius: 10,
        height: 36,
        marginLeft: 20,
      },
      android: {
        backgroundColor: backgroundColor(colorScheme),
        borderRadius: 4,
        borderWidth: 1,
        borderColor: textSecondaryColor(colorScheme),
        marginLeft: 10,
      },
    }),
    phoneInputText: {
      height: 25,
      color: textPrimaryColor(colorScheme),
    },
    phoneCountryCode: {
      height: Platform.OS === "android" ? undefined : 20,
      color: textPrimaryColor(colorScheme),
      fontWeight: "400",
    },
    flagButton: Platform.select({
      default: {
        backgroundColor: tertiaryBackgroundColor(colorScheme),
        borderRadius: 10,
        height: 36,
        width: 58,
      },
      android: {
        backgroundColor: backgroundColor(colorScheme),
        borderRadius: 4,
        borderWidth: 1,
        borderColor: textSecondaryColor(colorScheme),
      },
    }),
    flagChevron: Platform.select({
      default: { marginRight: 9, marginLeft: -2 },
      android: {
        marginLeft: -5,
      },
    }),
    countryPicker: {
      paddingLeft: 12,
    },
    otp: {
      flex: 1,
      flexDirection: "row",
      flexGrow: 0,
      width: Platform.OS === "android" ? 252 : 210,
      marginTop: 32,
    },
    otpFocus: {
      height: Platform.OS === "android" ? 25 : 18,
      width: 1.75,
    },
    otpText: {
      fontSize: 17,
      color: textPrimaryColor(colorScheme),
    },
    otpInput: {
      marginRight: 5,
      marginLeft: 5,
      ...Platform.select({
        default: {
          minWidth: 25,
          minHeight: 30,
          borderRadius: 3,
          borderWidth: 0,
          backgroundColor: tertiaryBackgroundColor(colorScheme),
        },
        android: {
          backgroundColor: backgroundColor(colorScheme),
          borderRadius: 4,
          borderWidth: 1,
          borderColor: textSecondaryColor(colorScheme),
          minHeight: 56,
          minWidth: 32,
        },
      }),
    },
  });
};
