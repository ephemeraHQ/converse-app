import Button from "@components/Button/Button";
import ValueProps from "@components/Onboarding/ValueProps";
import { Text } from "@design-system/Text";
import { textPrimaryColor } from "@styles/colors";
import { spacing } from "@theme/spacing";
import { AsYouType, CountryCode } from "libphonenumber-js";
import React, { memo, useRef } from "react";
import { Platform, StyleSheet, useColorScheme } from "react-native";
import * as RNLocalize from "react-native-localize";
import PhoneInput from "react-native-phone-number-input";

import { usePrivyConnectStore } from "./privyAuthStore";
import { usePrivySmsLogin } from "./usePrivySmsLogin";
import { VStack } from "../../../design-system/VStack";
import { translate } from "../../../i18n";

export const PrivyPhoneEntry = memo(() => {
  const styles = useStyles();
  const colorScheme = useColorScheme();
  const phoneInputRef = useRef<PhoneInput>(null);
  const { sendCode } = usePrivySmsLogin();
  const setPhone = usePrivyConnectStore((state) => state.setPhone);

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
});

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
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
  });
};
