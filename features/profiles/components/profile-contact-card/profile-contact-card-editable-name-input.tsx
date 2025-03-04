import { memo, useCallback } from "react"
import { TextField } from "@/design-system/TextField/TextField"
import { TextFieldProps } from "@/design-system/TextField/TextField.props"
import { translate } from "@/i18n"
import { useAppTheme } from "@/theme/use-app-theme"

type IProfileContactCardEditableNameInputProps = Omit<
  TextFieldProps,
  "onChangeText"
> & {
  onChangeText: (args: { text: string; error: string | undefined }) => void
}

export const ProfileContactCardEditableNameInput = memo(
  function ProfileContactCardEditableNameInput(
    props: IProfileContactCardEditableNameInputProps,
  ) {
    const { onChangeText, ...rest } = props

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
          borderWidth: theme.borderWidth.sm,
          borderColor:
            props.status === "error"
              ? theme.colors.global.caution
              : theme.colors.border.inverted.subtle,
          borderRadius: theme.borderRadius.xs,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
        }}
        maxLength={32}
        autoCorrect={false}
        onChangeText={handleChangeText}
        {...rest}
      />
    )
  },
)
