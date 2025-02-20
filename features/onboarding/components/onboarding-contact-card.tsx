import { Button } from "@/design-system/Button/Button";
import { Center } from "@/design-system/Center";
import { HStack } from "@/design-system/HStack";
import { IconButton } from "@/design-system/IconButton/IconButton";
import { Pressable } from "@/design-system/Pressable";
import { Text } from "@/design-system/Text";
import { TextField } from "@/design-system/TextField/TextField";
import { VStack } from "@/design-system/VStack";
import { ProfileContactCardContainer } from "@/features/profiles/components/profile-contact-card/profile-contact-card-container";
import { translate } from "@/i18n";
import { useAppTheme } from "@/theme/use-app-theme";
import { memo, useCallback, useState } from "react";
import { ViewStyle } from "react-native";
import { OnboardingEditableAvatar } from "./onboarding-editable-avatar";

type IOnboardingContactCardProps = {
  displayName?: string;
  setDisplayName: (displayName: string) => void;
  addPFP: () => void;
  pfpUri?: string;
  editable?: boolean;
  onImportPress: () => void;
};

export const OnboardingCreateContactCard = memo(
  function OnboardingCreateContactCard({
    displayName,
    setDisplayName,
    addPFP,
    pfpUri,
    onImportPress,
    editable = true,
  }: IOnboardingContactCardProps) {
    const { theme } = useAppTheme();
    const { spacing, borderRadius, borderWidth, colors } = theme;

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
      <ProfileContactCardContainer>
        <HStack
          style={{
            justifyContent: "space-between",
          }}
        >
          <Pressable disabled={!editable} onPress={addPFP}>
            <OnboardingEditableAvatar uri={pfpUri} name={displayName} />
          </Pressable>
          <Button text="Import" onPress={onImportPress} />
        </HStack>
        {editable ? (
          <TextField
            containerStyle={{
              marginTop: spacing.sm,
              marginBottom: spacing.md,
            }}
            label={translate("contactCard.name")}
            placeholder={translate("contactCard.namePlaceholder")}
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
              marginBottom: spacing.md,
              paddingLeft: spacing.xs,
              paddingVertical: spacing.xxs,
              paddingRight: spacing.xxs,
              borderRadius: borderRadius.xxs,
              borderWidth: borderWidth.sm,
              borderColor: colors.border.inverted.subtle,
            }}
          >
            <Text color="secondary" preset="smaller">
              {translate("contactCard.name")}
            </Text>
            <Text preset="small">{displayName}</Text>
          </VStack>
        )}
      </ProfileContactCardContainer>
    );
  }
);
