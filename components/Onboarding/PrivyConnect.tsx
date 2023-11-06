import { useLoginWithSMS, useEmbeddedWallet, usePrivy } from "@privy-io/expo";
import { ethers } from "ethers";
import * as LibPhoneNumber from "libphonenumber-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, useColorScheme } from "react-native";
import { CountryCode } from "react-native-country-picker-modal";
import * as RNLocalize from "react-native-localize";
import OtpInputs, { OtpInputsRef } from "react-native-otp-inputs";
import PhoneInput from "react-native-phone-number-input";

import { useOnboardingStore } from "../../data/store/onboardingStore";
import {
  tertiaryBackgroundColor,
  textSecondaryColor,
} from "../../utils/colors";
import { pick } from "../../utils/objects";
import Picto from "../Picto/Picto";
import OnboardingComponent from "./OnboardingComponent";

export default function PrivyConnect() {
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const { setConnectionMethod, setLoading, setSigner } = useOnboardingStore(
    (s) => pick(s, ["setConnectionMethod", "setLoading", "setSigner"])
  );

  const { isReady: privyReady, user: privyUser, logout } = usePrivy();

  useEffect(() => {
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

  const [phone, setPhone] = useState("");
  const [formattedPhone, setFormattedPhone] = useState("");
  const [beautifulPhone, setBeautifulPhone] = useState("");
  const otpCode = useRef("");

  const sendPhone = useCallback(async () => {
    const parsed = LibPhoneNumber.parsePhoneNumberFromString(formattedPhone);
    if (!parsed?.isValid) {
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
    }
  }, [loginWithCode, setLoading]);

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
            countryPickerProps={{
              flatListProps: { style: styles.countryPicker },
              withFilter: true,
              filterProps: { autoFocus: true },
            }}
            containerStyle={styles.phoneInputContainer}
            flagButtonStyle={styles.flagButton}
            textContainerStyle={styles.phoneInput}
            textInputStyle={styles.phoneInputText}
            codeTextStyle={styles.phoneCountryCode}
            renderDropdownImage={
              <Picto
                picto="chevron.down"
                color={textSecondaryColor(colorScheme)}
                size={12}
                style={{ marginRight: 9, marginLeft: -2 }}
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
    },
    phoneInputContainer: {
      marginTop: 32,
    },
    phoneInput: {
      backgroundColor: tertiaryBackgroundColor(colorScheme),
      borderRadius: 10,
      height: 36,
      marginLeft: 20,
    },
    phoneInputText: {
      height: 25,
    },
    phoneCountryCode: {
      height: 20,
      fontWeight: "400",
    },
    flagButton: {
      backgroundColor: tertiaryBackgroundColor(colorScheme),
      borderRadius: 10,
      height: 36,
      width: 58,
    },
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
      width: 25,
      borderRadius: 3,
      textAlign: "center",
      height: 30,
      marginRight: 10,
      backgroundColor: tertiaryBackgroundColor(colorScheme),
    },
  });
};
