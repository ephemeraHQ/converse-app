import { AnimatedVStack, VStack } from "@/design-system/VStack";
import {
  ONBOARDING_ENTERING_DELAY,
  ONBOARDING_ENTERING_DURATION,
} from "../constants/animation-constants";
import { useAppTheme } from "@/theme/useAppTheme";
import { memo, useCallback, useState } from "react";
import { Center } from "@/design-system/Center";
import { TextField } from "@/design-system/TextField/TextField";
import { ViewStyle } from "react-native";
import { Pressable } from "@/design-system/Pressable";
import { OnboardingEditableAvatar } from "./onboarding-editable-avatar";
import { translate } from "@/i18n";
import { IconButton } from "@/design-system/IconButton/IconButton";
import { Text } from "@/design-system/Text";

type IOnboardingContactCardProps = {
  displayName?: string;
  setDisplayName: (displayName: string) => void;
  addPFP: () => void;
  pfpUri?: string;
  editable?: boolean;
};

export const OnboardingCreateContactCard = memo(
  function OnboardingCreateContactCard({
    displayName,
    setDisplayName,
    addPFP,
    pfpUri,
    editable = true,
  }: IOnboardingContactCardProps) {
    const { theme } = useAppTheme();
    const { spacing, borderRadius, borderWidth, colors, animation } = theme;

    const clearName = useCallback(() => {
      setDisplayName("");
    }, [setDisplayName]);

    const [isTextFieldFocused, setIsTextFieldFocused] = useState(false);

    const onFocus = useCallback(() => {
      setIsTextFieldFocused(true);
    }, []);

    const onBlur = useCallback(() => {
      setIsTextFieldFocused(false);
    }, []);

    return (
      <AnimatedVStack
        style={{
          marginVertical: spacing.lg,
          padding: spacing.lg,
          backgroundColor: theme.colors.fill.inverted.primary,
          borderRadius: borderRadius.xxs,
        }}
        entering={animation
          .fadeInDownSlow()
          .delay(ONBOARDING_ENTERING_DELAY.THIRD)
          .duration(ONBOARDING_ENTERING_DURATION)}
      >
        <Pressable disabled={!editable} onPress={addPFP}>
          <OnboardingEditableAvatar uri={pfpUri} name={displayName} />
        </Pressable>
        {editable ? (
          <TextField
            containerStyle={{
              marginTop: spacing.sm,
            }}
            label={translate("onboarding.contactCard.name")}
            placeholder={translate("onboarding.contactCard.namePlaceholder")}
            keyboardType="email-address"
            autoCapitalize="none"
            value={displayName}
            onChangeText={setDisplayName}
            onFocus={onFocus}
            onBlur={onBlur}
            RightAccessory={({ style }) => {
              if (!displayName || !isTextFieldFocused) {
                return null;
              }
              return (
                <Center style={style as ViewStyle}>
                  <IconButton
                    onPress={clearName}
                    variant="ghost"
                    iconName="xmark.circle.fill"
                  />
                </Center>
              );
            }}
          />
        ) : (
          <VStack
            style={{
              marginTop: spacing.sm,
              paddingLeft: spacing.xs,
              paddingVertical: spacing.xxs,
              paddingRight: spacing.xxs,
              borderRadius: borderRadius.xxs,
              borderWidth: borderWidth.sm,
              borderColor: colors.border.subtle,
            }}
          >
            <Text color="secondary" preset="smaller">
              {translate("onboarding.contactCard.name")}
            </Text>
            <Text preset="small">{displayName}</Text>
          </VStack>
        )}
      </AnimatedVStack>
    );
  }
);
