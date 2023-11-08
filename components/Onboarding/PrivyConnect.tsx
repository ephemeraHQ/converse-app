import { useLoginWithSMS, useEmbeddedWallet, usePrivy } from "@privy-io/expo";
import { ethers } from "ethers";
import * as LibPhoneNumber from "libphonenumber-js";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  useColorScheme,
} from "react-native";
import { CountryCode } from "react-native-country-picker-modal";
import * as RNLocalize from "react-native-localize";
import OtpInputs, { OtpInputsRef } from "react-native-otp-inputs";
import PhoneInput from "react-native-phone-number-input";

import { useOnboardingStore } from "../../data/store/onboardingStore";
import {
  backgroundColor,
  tertiaryBackgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";
import { pick } from "../../utils/objects";
import Picto from "../Picto/Picto";
import OnboardingComponent from "./OnboardingComponent";

export default function PrivyConnect() {
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const { setConnectionMethod, setLoading, setSigner, setPrivyAccountId } =
    useOnboardingStore((s) =>
      pick(s, [
        "setConnectionMethod",
        "setLoading",
        "setSigner",
        "setPrivyAccountId",
      ])
    );

  const { isReady: privyReady, user: privyUser, logout } = usePrivy();

  useEffect(() => {
    setPrivyAccountId(undefined);
    logout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const embeddedWallet = useEmbeddedWallet();

  const { sendCode, loginWithCode } = useLoginWithSMS();

  const otpInputRef = useRef<OtpInputsRef>();
  const phoneInputRef = useRef<PhoneInput>(null);

  const [status, setStatus] = useState<"enter-phone" | "verify-phone">(
    "enter-phone"
  );

  const [formattedPhone, setFormattedPhone] = useState("");
  const [beautifulPhone, setBeautifulPhone] = useState("");
  const otpCode = useRef("");

  const sendPhone = useCallback(async () => {
    const parsed = LibPhoneNumber.parsePhoneNumberFromString(formattedPhone);
    if (!parsed?.isValid()) {
      Alert.alert("Please enter a valid phone number");
      return;
    }
    setLoading(true);
    setBeautifulPhone(parsed.formatInternational());
    await sendCode({ phone: parsed.number });
    setLoading(false);
    setStatus("verify-phone");
  }, [formattedPhone, sendCode, setLoading]);

  const submitCode = useCallback(async () => {
    if (otpCode.current.length !== 6) {
      otpInputRef.current?.reset();
      return;
    }
    setLoading(true);
    const user = await loginWithCode({ code: otpCode.current });
    if (!user) {
      setLoading(false);
      Alert.alert("The code you entered is not valid, please try again");
      otpInputRef.current?.reset();
      otpInputRef.current?.focus();
    } else {
      setPrivyAccountId(user.user.id);
    }
  }, [loginWithCode, setLoading, setPrivyAccountId]);

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
        privyUser &&
        embeddedWallet.status === "connected" &&
        status === "verify-phone" &&
        !gotEmbeddedWallet.current
      ) {
        gotEmbeddedWallet.current = true;
        const provider = embeddedWallet.provider;
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x2105" }], // Switching to base chain
        });
        const ethersProvider = new ethers.providers.Web3Provider(provider);
        const ethersSigner = ethersProvider.getSigner();
        setSigner(ethersSigner);
      }
    })();
  }, [embeddedWallet, privyUser, setSigner, status]);

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
              const formatter = new LibPhoneNumber.AsYouType(
                phoneInputRef.current?.getCountryCode() as LibPhoneNumber.CountryCode
              );
              const callingCode =
                phoneInputRef.current?.getCallingCode() as string;

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
              if (r && !otpInputRef.current) {
                otpInputRef.current = r;
                r.focus();
              }
            }}
            keyboardType="phone-pad"
            inputStyles={styles.otpInput}
            style={styles.otp}
          />
          <Text style={styles.text}>
            Enter confirmation code sent to{"\n"}
            {beautifulPhone}
          </Text>
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
      marginTop: 32,
    },
    otpInput: {
      textAlign: "center",
      marginRight: 5,
      marginLeft: 5,
      color: textPrimaryColor(colorScheme),
      ...Platform.select({
        default: {
          width: 25,
          borderRadius: 3,
          height: 30,
          backgroundColor: tertiaryBackgroundColor(colorScheme),
        },
        android: {
          backgroundColor: backgroundColor(colorScheme),
          borderRadius: 4,
          borderWidth: 1,
          borderColor: textSecondaryColor(colorScheme),
          height: 56,
          width: 32,
        },
      }),
    },
  });
};
