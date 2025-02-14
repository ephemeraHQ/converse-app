## SpecStory

## ```typescript
      === "enter-phone" ? <PhoneEntryComponent /> : <PhoneVerificationComponent />}
    </OnboardingScreen>
  );
}
```

With this refactoring, both `OnboardingPrivyScreen` and `NewAccountPrivyScreen` can now share the same logic and components for handling phone entry and verification. The custom hooks `usePrivyConnection` and `usePrivySmsLogin` encapsulate the logic for connecting to Privy and handling SMS login, while the components `PhoneEntryComponent` and `PhoneVerificationComponent` handle the UI for entering the phone number and verifying the OTP.

This approach promotes code reusability and maintainability, making it easier to manage changes in the future. You can now easily import and use these hooks and components in any other screens that require similar functionality. (10/7/2024, 8:36:39 PM)

_**User**_

I have this component but i also have a NewAccountPrivyScreen which share a lot of the same code .I'm trying to extract some of this code into custom hooks or custom component so NewAccountPrivyScreen could import it and reuse 

---

_**Assistant**_

Certainly! I can help you extract shared code into custom hooks and components for better reusability. Let's start by identifying the common parts and creating reusable elements. Here's how we can refactor the code:

1. Create a custom hook for Privy connection logic:

```typescript:hooks/usePrivyConnection.ts
import { useCallback, useEffect, useRef } from 'react';
import { useEmbeddedWallet, usePrivy } from "@privy-io/expo";
import { usePrivyAccessToken, usePrivySigner } from "@utils/evm/privy";
import { useOnboardingStore } from "@data/store/onboardingStore";
import { useSelect } from "@data/store/storeHelpers";
import { initXmtpClient } from "../../components/Onboarding/init-xmtp-client";
import { sentryTrackError } from "../../utils/sentry";

export function usePrivyConnection() {
  const { setSigner } = useOnboardingStore(useSelect(["setSigner"]));
  const { isReady: privyReady, user: privyUser, logout } = usePrivy();
  const embeddedWallet = useEmbeddedWallet();
  const privyAccountId = usePrivyAccountId();
  const privySigner = usePrivySigner(true);
  const privyAccessToken = usePrivyAccessToken();
  const creatingEmbeddedWallet = useRef(false);

  useEffect(() => {
    logout();
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
        sentryTrackError(error);
      }
    };

    initializeXmtp();
  }, [privyAccessToken, privyAccountId, privySigner, setSigner]);

  return { privyReady, privyUser, privySigner, privyAccessToken, privyAccountId };
}
```

2. Create a custom hook for SMS login logic:

```typescript:hooks/usePrivySmsLogin.ts
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useLoginWithSMS } from "@privy-io/expo";
import { formatPhoneNumberToBeautifulFormat, isValidPhoneNumber } from "@utils/phone";
import { translate } from "../../i18n";
import { sentryTrackError } from "../../utils/sentry";
import { usePrivyConnectStore } from './usePrivyConnectStore';

export function usePrivySmsLogin() {
  const { loginWithCode: loginWithCodePrivy, sendCode: sendCodePrivy } = useLoginWithSMS();
  const { setLoading, setOtpCode, setStatus, setPrivyAccountId } = usePrivyConnectStore();

  const sendCode = useCallback(async () => {
    const phone = usePrivyConnectStore.getState().phone;
    if (!isValidPhoneNumber(phone)) {
      Alert.alert(translate("privyConnect.errors.invalidPhoneNumber"));
      return false;
    }

    const beautifulPhone = formatPhoneNumberToBeautifulFormat(phone);
    if (!beautifulPhone) {
      Alert.alert(translate("privyConnect.errors.invalidPhoneNumber"));
      return false;
    }

    try {
      setLoading(true);
      setOtpCode("");
      await sendCodePrivy({ phone: beautifulPhone });
      setStatus("verify-phone");
      return true;
    } catch (error) {
      sentryTrackError(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [sendCodePrivy, setLoading, setOtpCode, setStatus]);

  const loginWithCode = useCallback(async () => {
    try {
      setLoading(true);
      const code = usePrivyConnectStore.getState().otpCode;
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
  }, [loginWithCodePrivy, setLoading, setPrivyAccountId]);

  return { sendCode, loginWithCode };
}
```

3. Create a custom store for Privy connection state:

```typescript:hooks/usePrivyConnectStore.ts
import { create } from 'zustand';

interface IPrivyConnectStore {
  phone: string;
  status: "enter-phone" | "verify-phone";
  privyAccountId: string;
  otpCode: string;
  retrySeconds: number;
  loading: boolean;
  setPhone: (phone: string) => void;
  setStatus: (status: "enter-phone" | "verify-phone") => void;
  setPrivyAccountId: (id: string) => void;
  setOtpCode: (code: string) => void;
  setRetrySeconds: (seconds: number) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  phone: "",
  status: "enter-phone" as const,
  privyAccountId: "",
  otpCode: "",
  retrySeconds: 0,
  loading: false,
};

export const usePrivyConnectStore = create<IPrivyConnectStore>((set) => ({
  ...initialState,
  setPhone: (phone) => set({ phone }),
  setStatus: (status) => set({ status }),
  setPrivyAccountId: (privyAccountId) => set({ privyAccountId }),
  setOtpCode: (otpCode) => set({ otpCode }),
  setRetrySeconds: (retrySeconds) => set({ retrySeconds }),
  setLoading: (loading) => set({ loading }),
  reset: () => set(initialState),
}));
```

4. Create reusable components:

```typescript:components/PhoneEntryComponent.tsx
import React, { useRef } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import PhoneInput from "react-native-phone-number-input";
import { AsYouType, CountryCode } from "libphonenumber-js";
import * as RNLocalize from "react-native-localize";
import { VStack } from "../../design-system/VStack";
import { Text } from "@design-system/Text";
import Button from "@components/Button/Button";
import Picto from "@components/Picto";
import ValueProps from "@components/Onboarding/ValueProps";
import { usePrivyConnectStore } from '../hooks/usePrivyConnectStore';
import { usePrivySmsLogin } from '../hooks/usePrivySmsLogin';
import { useStyles } from '../hooks/useStyles';
import { translate } from "../../i18n";
import { PictoSizes } from "@styles/sizes";
import { spacing } from "@theme/spacing";
import { textPrimaryColor, textSecondaryColor } from "@styles/colors";

export const PhoneEntryComponent = () => {
  const styles = useStyles();
  const colorScheme = useColorScheme();
  const phoneInputRef = useRef<PhoneInput>(null);
  const { sendCode } = usePrivySmsLogin();
  const { setPhone } = usePrivyConnectStore();

  return (
    <VStack style={{ flex: 1 }}>
      <VStack style={{ marginBottom: spacing.lg }}>
        <ValueProps />
      </VStack>

      <VStack style={{ rowGap: spacing.md }}>
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
            return formatted.slice(callingCode.length + 1).trim();
          }}
          onChangeFormattedText={setPhone}
          withDarkTheme={colorScheme === "dark"}
          autoFocus
          // ... (rest of the PhoneInput props)
        />
        <VStack style={{ rowGap: spacing.xs }}>
          <Button
            style={{ marginHorizontal: 0 }}
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
```

```typescript:components/PhoneVerificationComponent.tsx
import React, { useRef, useState, useEffect } from 'react';
import { Text, Keyboard, StyleSheet, useColorScheme } from 'react-native';
import { OtpInput, OtpInputRef } from "react-native-otp-entry";
import { usePrivyConnectStore } from '../hooks/usePrivyConnectStore';
import { usePrivySmsLogin } from '../hooks/usePrivySmsLogin';
import { useStyles } from '../hooks/useStyles';
import { translate } from "../../i18n";
import { formatPhoneNumberToBeautifulFormat } from "@utils/phone";
import { textSecondaryColor } from "@styles/colors";
import { ResendCodeButton } from './ResendCodeButton';

export const PhoneVerificationComponent = () => {
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
      keyboardListeners.forEach(listener => listener.remove());
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
```

5. Update the main OnboardingPrivyScreen component:

```typescript:screens/Onboarding/OnboardingPrivyScreen.tsx
import React from 'react';
import { OnboardingScreen } from "../../components/Onboarding/OnboardingScreen";
import { OnboardingPictoTitleSubtitle } from "../../components/Onboarding/OnboardingPictoTitleSubtitle";
import { PhoneEntryComponent } from '../../components/PhoneEntryComponent';
import { PhoneVerificationComponent } from '../../components/PhoneVerificationComponent';
import { usePrivyConnection } from '../../hooks/usePrivyConnection';
import { usePrivyConnectStore } from '../../hooks/usePrivyConnectStore';
import { translate } from "../../i18n";
import { PictoSizes } from "@styles/sizes";

export function OnboardingPrivyScreen() {
  const { privyReady, privyUser } = usePrivyConnection();
  const status = usePrivyConnectStore(state => state.status);

  return (
    <OnboardingScreen preset="scroll">
      <OnboardingPictoTitleSubtitle.Container>
        <OnboardingPictoTitleSubtitle.Picto
          picto={status === "enter-phone" ? "phone" : "checkmark"}
          size={PictoSizes.onboardingComponent}
        />
        <OnboardingPictoTitleSubtitle.Title>
          {translate("privyConnect.title.enterPhone")}
        </OnboardingPictoTitleSubtitle.Title>
      </OnboardingPictoTitleSubtitle.Container>
      {status === "enter-phone" ? <PhoneEntryComponent /> : <PhoneVerificationComponent />}
    </OnboardingScreen>
  );
}
```

Now you can create a `NewAccountPrivyScreen` that uses the same components and hooks:

```typescript:screens/Onboarding/NewAccountPrivyScreen.tsx
import React from 'react';
import { OnboardingScreen } from "../../components/Onboarding/OnboardingScreen";
import { OnboardingPictoTitleSubtitle } from "../../components/Onboarding/OnboardingPictoTitleSubtitle";
import { PhoneEntryComponent } from '../../components/PhoneEntryComponent';
import { PhoneVerificationComponent } from '../../components/PhoneVerificationComponent';
import { usePrivyConnection } from '../../hooks/usePrivyConnection';
import { usePrivyConnectStore } from '../../hooks/usePrivyConnectStore';
import { translate } from "../../i18n";
import { PictoSizes } from "@styles/sizes";

export function NewAccountPrivyScreen() {
  const { privyReady, privyUser } = usePrivyConnection();
  const status = usePrivyConnectStore(state => state.status);

  return (
    <OnboardingScreen preset="scroll">
      <OnboardingPictoTitleSubtitle.Container>
        <OnboardingPictoTitleSubtitle.Picto
          picto={status === "enter-phone" ? "phone" : "checkmark"}
          size={PictoSizes.onboardingComponent}
        />
        <OnboardingPictoTitleSubtitle.Title>
          {translate("newAccount.title.enterPhone")}
        </OnboardingPictoTitleSubtitle.Title>
      </OnboardingPictoTitleSubtitle.Container>
      {status

---

_**User**_

Your response got cut off, because you only have limited response space. Continue writing exactly where you left off. Do not repeat yourself. Start your response with: "title.Container>
      {status", though use backticks where appropriate

---

_**Assistant**_

```typescript
title.Container>
      {status === "enter-phone" ? <PhoneEntryComponent /> : <PhoneVerificationComponent />}
    </OnboardingScreen>
  );
}
```

This refactoring approach extracts shared logic into custom hooks and reusable components, allowing both `OnboardingPrivyScreen` and `NewAccountPrivyScreen` to use the same underlying structure while maintaining the flexibility to customize specific elements if needed.

The main differences between the two screens can be handled through props or by slightly modifying the components as needed. For example, you might want to pass different translations or styling props to the components in the `NewAccountPrivyScreen`.

By using this modular approach, you can easily maintain and update both screens while reducing code duplication. If you need to make changes to the Privy connection logic or phone verification process, you can do so in the shared hooks and components, and the changes will be reflected in both screens.

---



---

