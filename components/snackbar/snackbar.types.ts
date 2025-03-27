export type ISnackbar = {
  key: string
  message: string | React.ReactNode
  type?: "error" | "success" | "info"
  isMultiLine?: boolean
  actions?: {
    label: string
    onPress: () => void
  }[]
}
