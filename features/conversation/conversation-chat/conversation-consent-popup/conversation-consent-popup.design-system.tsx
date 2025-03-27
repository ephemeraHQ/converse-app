import { Button } from "@design-system/Button/Button"
import React from "react"
import { IButtonProps } from "@/design-system/Button/Button.props"
import { ITextProps, Text } from "@/design-system/Text"
import { IVStackProps, VStack } from "@/design-system/VStack"
import { useAppTheme } from "@/theme/use-app-theme"

export function ConversationConsentPopupButton({ style, ...rest }: IButtonProps) {
  return <Button size="lg" style={[{ width: "100%" }, style]} withHapticFeedback={true} {...rest} />
}

export function ConversationConsentPopupHelperText({ style, ...rest }: ITextProps) {
  const { theme } = useAppTheme()

  return (
    <Text
      preset="formHelper"
      style={[{ paddingTop: theme.spacing.xxs, textAlign: "center" }, style]}
      {...rest}
    />
  )
}

export function ConsentPopupButtonsContainer({ children, style, ...rest }: IVStackProps) {
  const { theme } = useAppTheme()

  return (
    <VStack
      style={[
        {
          justifyContent: "center",
          gap: theme.spacing.xxs,
          paddingBottom: theme.spacing.sm,
          width: "100%",
          alignItems: "stretch",
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </VStack>
  )
}

export function ConversationConsentPopupContainer({ children, style, ...rest }: IVStackProps) {
  const { theme } = useAppTheme()

  return (
    <VStack
      style={[
        {
          flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "center",
          padding: theme.spacing.sm,
          marginTop: theme.spacing.sm,
          borderTopWidth: theme.borderWidth.sm,
          borderTopColor: theme.colors.border.subtle,
          width: "100%",
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </VStack>
  )
}
