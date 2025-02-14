## SpecStory

## Phone Entry and Verification Components (9/27/2024, 6:06:07 PM)

_**User**_

create a component for entry and one for verification

---

_**Assistant**_

Certainly! I'll create two separate components for the phone entry and verification sections. Here's how we can refactor the code:

```typescript:screens/Onboarding/PrivyConnectScreen.tsx
// ... existing imports ...
import { PhoneEntryComponent } from './PhoneEntryComponent';
import { PhoneVerificationComponent } from './PhoneVerificationComponent';

export function PrivyConnectScreen() {
  // ... existing code ...

  return (
    <Screen
      preset="scroll"
      // ... existing props ...
    >
      <PictoTitleSubtitle.Container
        style={{
          marginBottom: spacing.xxl,
          marginTop: spacing.xl,
        }}
      >
        <PictoTitleSubtitle.Picto
          picto="message.circle.fill"
          size={PictoSizes.onboardingComponent}
        />
        <PictoTitleSubtitle.Title>
          {translate("walletSelector.title")}
        </PictoTitleSubtitle.Title>
        <PictoTitleSubtitle.Subtitle>
          {translate("walletSelector.subtitle")}
        </PictoTitleSubtitle.Subtitle>
      </PictoTitleSubtitle.Container>

      {status === "enter-phone" ? (
        <PhoneEntryComponent
          phoneInputRef={phoneInputRef}
          colorScheme={colorScheme}
          setFormattedPhone={setFormattedPhone}
          styles={styles}
        />
      ) : (
        <PhoneVerificationComponent
          beautifulPhone={beautifulPhone}
          otpInputRef={otpInputRef}
          showOtpTick={showOtpTick}
          colorScheme={colorScheme}
          retrySeconds={retrySeconds}
          submitCode={submitCode}
          sendPhone={sendPhone}
          styles={styles}
        />
      )}
    </Screen>
  );
}

// ... existing styles ...
```

Now, let's create the two new components:

```typescript:screens/Onboarding/PhoneEntryComponent.tsx
import React from 'react';
import { Text, View, useColorScheme } from 'react-native';
import PhoneInput from 'react-native-phone-number-input';
import { CountryCode } from 'libphonenumber-js';
import * as RNLocalize from 'react-native-localize';
import LibPhoneNumber from 'libphonenumber-js';
import { translate } from 'i18n-js';
import Picto from '@components/Picto';
import { PictoSizes } from '@styles/sizes';
import { textPrimaryColor, textSecondaryColor } from '@styles/colors';
import ValueProps from '@components/Onboarding/ValueProps';

export const PhoneEntryComponent = ({
  phoneInputRef,
  colorScheme,
  setFormattedPhone,
  styles,
}) => {
  return (
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
        withDarkTheme={colorScheme === 'dark'}
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
          placeholder: translate('privyConnect.phoneInput.placeholder'),
          style: {},
        }}
        codeTextStyle={{ display: 'none' }}
        renderDropdownImage={
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-start',
              alignItems: 'center',
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
      <Text style={styles.p}>{translate('privyConnect.storedSecurely')}</Text>
    </>
  );
};
```

```typescript:screens/Onboarding/PhoneVerificationComponent.tsx
import React from 'react';
import { Text } from 'react-native';
import { OtpInput } from 'react-native-otp-entry';
import { Button } from '@components/Button';
import { translate } from 'i18n-js';
import { textPrimaryColor, textSecondaryColor, primaryColor } from '@styles/colors';

export const PhoneVerificationComponent = ({
  beautifulPhone,
  otpInputRef,
  showOtpTick,
  colorScheme,
  retrySeconds,
  submitCode,
  sendPhone,
  styles,
}) => {
  return (
    <>
      <Text style={styles.text}>
        {translate('privyConnect.otpInput.enterCode')}
      </Text>
      <Text style={[styles.text, { fontWeight: '600' }]}>{beautifulPhone}</Text>
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
            ? translate('privyConnect.resendCodeIn', {
                seconds: retrySeconds,
              })
            : translate('privyConnect.buttons.resendCode')
        }
        onPress={() => {
          if (retrySeconds > 0) return;
          sendPhone();
        }}
      />
    </>
  );
};
```

These changes separate the phone entry and verification components, making the code more modular and easier to maintain. The main `PrivyConnectScreen` component now conditionally renders either the `PhoneEntryComponent` or the `PhoneVerificationComponent` based on the `status` state.

Remember to update your imports at the top of the `PrivyConnectScreen.tsx` file to include these new components:

```typescript
import { PhoneEntryComponent } from './PhoneEntryComponent';
import { PhoneVerificationComponent } from './PhoneVerificationComponent';
```

This refactoring should make your code more organized and easier to manage.

---

_**User**_

you dont need to pass that many props. Like styles you can use useStyles and for colorSchemes too. Also, create the components inside the same component

---

_**Assistant**_

You're absolutely right. I apologize for the oversight. Let's refactor the code to keep everything in the same file and use hooks for styles and color schemes within the components. Here's the updated version:

```typescript:screens/Onboarding/PrivyConnectScreen.tsx
// ... existing imports ...

export function PrivyConnectScreen() {
  // ... existing code ...

  return (
    <Screen
      preset="scroll"
      // ... existing props ...
    >
      <PictoTitleSubtitle.Container
        style={{
          marginBottom: spacing.xxl,
          marginTop: spacing.xl,
        }}
      >
        <PictoTitleSubtitle.Picto
          picto="message.circle.fill"
          size={PictoSizes.onboardingComponent}
        />
        <PictoTitleSubtitle.Title>
          {translate("walletSelector.title")}
        </PictoTitleSubtitle.Title>
        <PictoTitleSubtitle.Subtitle>
          {translate("walletSelector.subtitle")}
        </PictoTitleSubtitle.Subtitle>
      </PictoTitleSubtitle.Container>

      {status === "enter-phone" ? (
        <PhoneEntryComponent
          phoneInputRef={phoneInputRef}
          setFormattedPhone={setFormattedPhone}
        />
      ) : (
        <PhoneVerificationComponent
          beautifulPhone={beautifulPhone}
          otpInputRef={otpInputRef}
          showOtpTick={showOtpTick}
          retrySeconds={retrySeconds}
          submitCode={submitCode}
          sendPhone={sendPhone}
        />
      )}
    </Screen>
  );
}

const PhoneEntryComponent = ({ phoneInputRef, setFormattedPhone }) => {
  const styles = useStyles();
  const colorScheme = useColorScheme();

  return (
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
        onChangeFormattedText={setFormattedPhone}
        withDarkTheme={colorScheme === 'dark'}
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
          placeholder: translate('privyConnect.phoneInput.placeholder'),
          style: {},
        }}
        codeTextStyle={{ display: 'none' }}
        renderDropdownImage={
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-start',
              alignItems: 'center',
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
      <Text style={styles.p}>{translate('privyConnect.storedSecurely')}</Text>
    </>
  );
};

const PhoneVerificationComponent = ({
  beautifulPhone,
  otpInputRef,
  showOtpTick,
  retrySeconds,
  submitCode,
  sendPhone,
}) => {
  const styles = useStyles();
  const colorScheme = useColorScheme();

  return (
    <>
      <Text style={styles.text}>
        {translate('privyConnect.otpInput.enterCode')}
      </Text>
      <Text style={[styles.text, { fontWeight: '600' }]}>{beautifulPhone}</Text>
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
            ? translate('privyConnect.resendCodeIn', {
                seconds: retrySeconds,
              })
            : translate('privyConnect.buttons.resendCode')
        }
        onPress={() => {
          if (retrySeconds > 0) return;
          sendPhone();
        }}
      />
    </>
  );
};

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    // ... existing styles ...
  });
};
```

This refactored version:

1. Keeps all components in the same file.
2. Uses the `useStyles` hook within each component to access styles.
3. Uses `useColorScheme` within each component to access the color scheme.
4. Reduces the number of props passed to each component.

This approach maintains the modularity of the code while keeping related components together and reducing prop drilling. It also allows each component to manage its own styles and color scheme, making them more self-contained.

---



---

