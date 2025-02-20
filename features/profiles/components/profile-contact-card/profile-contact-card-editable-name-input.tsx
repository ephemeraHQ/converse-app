import { TextField } from "@/design-system/TextField/TextField";
import { TextFieldProps } from "@/design-system/TextField/TextField.props";
import { translate } from "@/i18n";
import { useAppTheme } from "@/theme/use-app-theme";
import { memo } from "react";

type IProfileContactCardEditableNameInputProps = TextFieldProps;

export const ProfileContactCardEditableNameInput = memo(
  function ProfileContactCardEditableNameInput(
    props: IProfileContactCardEditableNameInputProps
  ) {
    const { theme } = useAppTheme();

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
        {...props}
      />
    );
  }
);
