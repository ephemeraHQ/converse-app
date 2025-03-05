import { memo, useCallback } from "react"
import { Center } from "@/design-system/Center"
import { IconButton } from "@/design-system/IconButton/IconButton"
import { TextField } from "@/design-system/TextField/TextField"
import { TextFieldProps } from "@/design-system/TextField/TextField.props"
import { translate } from "@/i18n"
import { useAppTheme } from "@/theme/use-app-theme"

type IProfileContactCardEditableNameInputProps = Omit<TextFieldProps, "onChangeText"> & {
  onChangeText: (args: { text: string; error: string | undefined }) => void
  isOnchainName?: boolean
}

export const ProfileContactCardEditableNameInput = memo(
  function ProfileContactCardEditableNameInput(props: IProfileContactCardEditableNameInputProps) {
    const { onChangeText, isOnchainName, ...rest } = props

    const { theme } = useAppTheme()

    const handleChangeText = useCallback(
      (text: string) => {
        // const result = profileValidationSchema.shape.name.safeParse(text)
        onChangeText?.({
          text,
          error: undefined,
          // error: result.success ? undefined : result.error.message,
        })
      },
      [onChangeText],
    )

    return (
      <TextField
        label={translate("contactCard.name")}
        placeholder={translate("userProfile.inputs.displayName.placeholder")}
        containerStyle={{ backgroundColor: "transparent" }}
        inputWrapperStyle={{
          backgroundColor: "transparent",
          borderWidth: theme.borderWidth.sm,
          borderColor:
            props.status === "error"
              ? theme.colors.global.caution
              : theme.colors.border.inverted.subtle,
          borderRadius: theme.borderRadius.xs,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
        }}
        style={{
          color: theme.colors.text.inverted.primary,
        }}
        maxLength={32}
        autoCorrect={false}
        onChangeText={handleChangeText}
        editable={!isOnchainName}
        RightAccessory={
          isOnchainName
            ? (props) => (
                <Center
                  style={{
                    paddingRight: theme.spacing.xxs,
                  }}
                >
                  <IconButton
                    onPress={() => {
                      handleChangeText("")
                    }}
                    iconName="xmark.circle.fill"
                  />
                </Center>
              )
            : undefined
        }
        {...rest}
      />
    )
  },
)
