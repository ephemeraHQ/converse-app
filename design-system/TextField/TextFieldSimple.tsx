import { memo } from "react"
import { useAppTheme } from "../../theme/use-app-theme"
import { TextField } from "./TextField"
import { TextFieldProps } from "./TextField.props"

type ITextFieldSimpleSize = "md" | "lg"

type ITextFieldSimpleProps = Omit<
  TextFieldProps,
  "label" | "labelTx" | "labelTxOptions" | "helper" | "helperTx" | "helperTxOptions"
> & {
  size?: ITextFieldSimpleSize
}

export const TextFieldSimple = memo(function TextFieldSimple(props: ITextFieldSimpleProps) {
  const { theme } = useAppTheme()

  const { size = "md", ...rest } = props

  return (
    <TextField
      inputWrapperStyle={{
        borderRadius: theme.borderRadius.sm,
        paddingHorizontal: size === "md" ? theme.spacing.xs : theme.spacing.sm,
        paddingVertical: size === "md" ? theme.spacing.xxs : theme.spacing.xs,
      }}
      {...rest}
    />
  )
})
