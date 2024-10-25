import Button from "@components/Button/Button";
import ValueProps from "@components/Onboarding/ValueProps";
import { Text } from "@design-system/Text";
import {
  backgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { spacing } from "@theme/spacing";
import { AsYouType, CountryCode } from "libphonenumber-js";
import React, { memo, useRef } from "react";
import { Platform, StyleSheet, useColorScheme, View } from "react-native";
import * as RNLocalize from "react-native-localize";
import PhoneInput, { PhoneInputProps } from "react-native-phone-number-input";

import { usePrivyAuthStoreContext } from "./privyAuthStore";
import { usePrivySmsLogin } from "./usePrivySmsLogin";
import { Terms } from "../../../components/Onboarding/Terms";
import Picto from "../../../components/Picto";
import { VStack } from "../../../design-system/VStack";
import { translate } from "../../../i18n";
import { PictoSizes } from "../../../styles/sizes";

export const PrivyPhoneEntry = memo(() => {
  const styles = useStyles();
  const colorScheme = useColorScheme();
  const phoneInputRef = useRef<PhoneInput>(null);
  const { sendCode } = usePrivySmsLogin();
  const setPhone = usePrivyAuthStoreContext((state) => state.setPhone);
  const loading = usePrivyAuthStoreContext((state) => state.loading);

  return (
    <VStack style={{ flex: 1, rowGap: spacing.lg }}>
      <VStack>
        <ValueProps />
      </VStack>

      <VStack
        style={{
          rowGap: spacing.xs,
        }}
      >
        <PhoneInput
          ref={phoneInputRef}
          defaultCode={
            RNLocalize.getCountry() as PhoneInputProps["defaultCode"]
          }
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
        <Text style={styles.p}>{translate("privyConnect.storedSecurely")}</Text>
      </VStack>

      <VStack style={{ rowGap: spacing.xs }}>
        <Button
          style={{ marginHorizontal: 0 }}
          variant="fill"
          title={translate("privyConnect.buttons.continue")}
          onPress={sendCode}
          loading={loading}
        />
        <Terms />
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
    phoneInputContainer: {
      marginHorizontal: spacing.lg,
      borderColor: textSecondaryColor(colorScheme),
      borderWidth: 1,
      borderRadius: 8,
      paddingLeft: 12,
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
      color: textSecondaryColor(colorScheme),
      marginRight: spacing.sm,
      alignItems: "center",
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
