import { ViewStyle } from "react-native"
import { ActivityIndicator } from "@/design-system/activity-indicator"
import { IIconName } from "@/design-system/Icon/Icon.types"
import { IIconButtonProps } from "@/design-system/IconButton/IconButton.props"
import { OnboardingIconButton } from "@/features/auth-onboarding/components/onboarding-icon-button"
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme"
import { OnboardingFooterText } from "./onboarding-footer-text"

type IOnboardingFooterProps = {
  text: string
  iconName: IIconName
  onPress: () => void
  disabled?: boolean
  isLoading?: boolean
  iconButtonProps?: IIconButtonProps
}

const $iconButtonStyle: ThemedStyle<ViewStyle> = ({ borderRadius }) => ({
  borderRadius: borderRadius.lg,
})

export function OnboardingFooter({
  text,
  iconName,
  onPress,
  disabled,
  isLoading,
  iconButtonProps,
}: IOnboardingFooterProps) {
  const { themed } = useAppTheme()

  return (
    <>
      <OnboardingIconButton
        action="primary"
        size="xl"
        disabled={disabled || isLoading}
        style={themed($iconButtonStyle)}
        onPress={onPress}
        {...(isLoading
          ? { icon: <ActivityIndicator /> }
          : {
              iconName,
            })}
        {...iconButtonProps}
      />
      <OnboardingFooterText color={disabled ? "inactive" : "primary"}>{text}</OnboardingFooterText>
    </>
  )
}
