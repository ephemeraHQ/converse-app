import Button from "@components/Button/Button";
import ValueProps from "@components/Onboarding/ValueProps";
import Picto from "@components/Picto";
import { useOnboardingStore } from "@data/store/onboardingStore";
import { useSelect } from "@data/store/storeHelpers";
import { Text } from "@design-system/Text";
import { useEmbeddedWallet, useLoginWithSMS, usePrivy } from "@privy-io/expo";
import {
  backgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { PictoSizes } from "@styles/sizes";
import { spacing } from "@theme/spacing";
import { usePrivyAccessToken, usePrivySigner } from "@utils/evm/privy";
import {
  formatPhoneNumberToBeautifulFormat,
  isValidPhoneNumber,
} from "@utils/phone";
import { AsYouType, CountryCode } from "libphonenumber-js";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  Platform,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import * as RNLocalize from "react-native-localize";
import { OtpInput, OtpInputRef } from "react-native-otp-entry";
import PhoneInput from "react-native-phone-number-input";
import { create } from "zustand";

import { OnboardingPictoTitleSubtitle } from "../../components/Onboarding/OnboardingPictoTitleSubtitle";
import { OnboardingScreen } from "../../components/Onboarding/OnboardingScreen";
import { initXmtpClient } from "../../components/Onboarding/init-xmtp-client";
import { VStack } from "../../design-system/VStack";
import { translate } from "../../i18n";
import { sentryTrackError } from "../../utils/sentry";

export function OnboardingPrivyScreen() {
  const { setSigner } = useOnboardingStore(useSelect(["setSigner"]));

  const { isReady: privyReady, user: privyUser, logout } = usePrivy();

  const embeddedWallet = useEmbeddedWallet();

  const privyAccountId = usePrivyAccountId();
  const privySigner = usePrivySigner(true);
  const privyAccessToken = usePrivyAccessToken();

  const creatingEmbeddedWallet = useRef(false);

  useEffect(() => {
    return () => {
      resetPrivyConnectStore();
    };
  }, []);

  useEffect(() => {
    logout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  useEffect(() => {
    const initializeXmtp = async () => {
      try {
        if (privySigner && privyAccessToken && privyAccountId) {
          setSigner(privySigner);
          await initXmtpClient({
            signer: privySigner,
            address: await privySigner.getAddress(),
            connectionMethod: "phone",
            privyAccountId,
            isEphemeral: false,
            pkPath: "",
          });
        }
      } catch (error) {
        // TODO: Show error to user
        sentryTrackError(error);
      }
    };

    initializeXmtp();
  }, [privyAccessToken, privyAccountId, privySigner, setSigner]);

  return (
    <OnboardingScreen preset="scroll">
      <OnboardingPictoTitleSubtitle.Container>
        <OnboardingPictoTitleSubtitlePictoWrapper />
        <OnboardingPictoTitleSubtitle.Title>
          {translate("privyConnect.title.enterPhone")}
        </OnboardingPictoTitleSubtitle.Title>
      </OnboardingPictoTitleSubtitle.Container>
      <MainInput />
    </OnboardingScreen>
  );
}

export const OnboardingPictoTitleSubtitlePictoWrapper = memo(
  function OnboardingPictoTitleSubtitlePictoWrapper() {
    const status = useStatus();
    return (
      <OnboardingPictoTitleSubtitle.Picto
        picto={status === "enter-phone" ? "phone" : "checkmark"}
        size={PictoSizes.onboardingComponent}
      />
    );
  }
);

const MainInput = memo(function MainInput() {
  const status = useStatus();

  if (status === "enter-phone") {
    return <PhoneEntryComponent />;
  }

  return <PhoneVerificationComponent />;
});

const PhoneEntryComponent = () => {
  const styles = useStyles();
  const colorScheme = useColorScheme();

  const phoneInputRef = useRef<PhoneInput>(null);

  const { sendCode } = useLoginWithSmsWrapper();

  return (
    <VStack
      // {...debugBorder()}
      style={{
        flex: 1,
      }}
    >
      <VStack
        style={{
          marginBottom: spacing.lg,
        }}
      >
        <ValueProps />
      </VStack>

      <VStack
        style={{
          rowGap: spacing.md,
        }}
      >
        <PhoneInput
          ref={phoneInputRef}
          defaultCode={RNLocalize.getCountry() as CountryCode}
          layout="first"
          formatter={(t) => {
            const countryCode = phoneInputRef.current?.getCountryCode();
            const callingCode = phoneInputRef.current?.getCallingCode();
            if (!countryCode || !callingCode) return t;

            const formatter = new AsYouType(countryCode as CountryCode);

            const formatted = formatter.input(`+${callingCode}${t}`);
            const result = formatted.slice(callingCode.length + 1).trim();
            return result;
          }}
          onChangeFormattedText={setPhoneValue}
          withDarkTheme={colorScheme === "dark"}
          autoFocus
          countryPickerProps={{
            flatListProps: { style: styles.countryPicker },
            withFilter: true,
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
          }
          flagSize={20}
        />
        <VStack
          style={{
            rowGap: spacing.xs,
          }}
        >
          <Button
            style={{
              marginHorizontal: 0, // TODO: Remove when we fixed the button component
            }}
            variant="primary"
            title={translate("privyConnect.buttons.continue")}
            onPress={sendCode}
          />
          <Text style={styles.p}>
            {translate("privyConnect.storedSecurely")}
          </Text>
        </VStack>
      </VStack>
    </VStack>
  );
};

const PhoneVerificationComponent = () => {
  const styles = useStyles();
  const colorScheme = useColorScheme();
  const otpInputRef = useRef<OtpInputRef>();
  const [showOtpTick, setShowOtpTick] = useState(true);

  const { loginWithCode, sendCode } = useLoginWithSmsWrapper();

  const phone = usePhoneValue();
  const beautifulPhone = formatPhoneNumberToBeautifulFormat(phone);

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      "keyboardWillShow",
      () => setShowOtpTick(true)
    );
    const keyboardWillHideListener = Keyboard.addListener(
      "keyboardWillHide",
      () => setShowOtpTick(false)
    );
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setShowOtpTick(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setShowOtpTick(false)
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
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
};

const ResendCodeButton = memo(function ResendCodeButton(props: {
  onPress: () => Promise<boolean>;
}) {
  const { onPress } = props;

  const loading = useLoading();

  const [retrySeconds, setRetrySeconds] = useState(60);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (retrySeconds > 0) {
      intervalId = setInterval(() => {
        setRetrySeconds((prevSeconds) => prevSeconds - 1);
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [retrySeconds]);

  const handlePress = useCallback(async () => {
    try {
      if (retrySeconds > 0) return;

      const success = await onPress();

      if (success) {
        setRetrySeconds(60);
      }
    } catch (error) {
      sentryTrackError(error);
    }
  }, [onPress, retrySeconds]);

  return (
    <Button
      variant="text"
      title={
        retrySeconds > 0
          ? `${translate("privyConnect.buttons.resendCode")} (${retrySeconds}s)`
          : translate("privyConnect.buttons.resendCode")
      }
      onPress={handlePress}
      loading={loading}
    />
  );
});

function useLoginWithSmsWrapper() {
  const { loginWithCode: loginWithCodePrivy, sendCode: sendCodePrivy } =
    useLoginWithSMS();

  const sendCode = useCallback(async () => {
    const phone = getPhoneValue();
    if (!isValidPhoneNumber(phone)) {
      Alert.alert(translate("privyConnect.errors.invalidPhoneNumber"));
      return Promise.resolve(false);
    }

    const beautifulPhone = formatPhoneNumberToBeautifulFormat(phone);
    if (!beautifulPhone) {
      Alert.alert(translate("privyConnect.errors.invalidPhoneNumber"));
      return Promise.resolve(false);
    }

    try {
      setLoading(true);
      setOtpCode("");
      await sendCodePrivy({ phone: beautifulPhone });
      setStatus("verify-phone");
      setLoading(false);
      return Promise.resolve(true);
    } catch (error) {
      sentryTrackError(error);
      setLoading(false);
      return Promise.resolve(false);
    }
  }, [sendCodePrivy]);

  const loginWithCode = useCallback(async () => {
    try {
      setLoading(true);

      const code = getOtpCode();

      const user = await loginWithCodePrivy({ code });

      if (!user) {
        Alert.alert(translate("privyConnect.errors.invalidCode"));
      } else {
        setPrivyAccountId(user.id);
      }
    } catch (error) {
      sentryTrackError(error);
    } finally {
      setLoading(false);
    }
  }, [loginWithCodePrivy]);

  return { loginWithCode, sendCode };
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
      width: "100%",
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

interface IPrivyConnectStore {
  phone: string;
  status: "enter-phone" | "verify-phone";
  privyAccountId: string;
  otpCode: string;
  retrySeconds: number;
  loading: boolean;
}

const initialState: IPrivyConnectStore = {
  phone: "",
  status: "enter-phone",
  privyAccountId: "",
  otpCode: "",
  retrySeconds: 0,
  loading: false,
};

const usePrivyConnectStore = create<IPrivyConnectStore>(() => ({
  ...initialState,
}));

function resetPrivyConnectStore() {
  usePrivyConnectStore.setState(initialState);
}

function usePhoneValue() {
  return usePrivyConnectStore((state) => state.phone);
}

function getPhoneValue() {
  return usePrivyConnectStore.getState().phone;
}

function setPhoneValue(phone: string) {
  usePrivyConnectStore.setState({ phone });
}

function usePrivyAccountId() {
  return usePrivyConnectStore((state) => state.privyAccountId);
}

function getPrivyAccountId() {
  return usePrivyConnectStore.getState().privyAccountId;
}

function setPrivyAccountId(privyAccountId: string) {
  usePrivyConnectStore.setState({ privyAccountId });
}

function useStatus() {
  return usePrivyConnectStore((state) => state.status);
}

function getStatus() {
  return usePrivyConnectStore.getState().status;
}

function setStatus(status: "enter-phone" | "verify-phone") {
  usePrivyConnectStore.setState({ status });
}

function useOtpCode() {
  return usePrivyConnectStore((state) => state.otpCode);
}

function getOtpCode() {
  return usePrivyConnectStore.getState().otpCode;
}

function setOtpCode(otpCode: string) {
  usePrivyConnectStore.setState({ otpCode });
}

function useRetrySeconds() {
  return usePrivyConnectStore((state) => state.retrySeconds);
}

function getRetrySeconds() {
  return usePrivyConnectStore.getState().retrySeconds;
}

function setRetrySeconds(retrySeconds: number) {
  usePrivyConnectStore.setState({ retrySeconds });
}

function useLoading() {
  return usePrivyConnectStore((state) => state.loading);
}

function getLoading() {
  return usePrivyConnectStore.getState().loading;
}

function setLoading(loading: boolean) {
  usePrivyConnectStore.setState({ loading });
}
