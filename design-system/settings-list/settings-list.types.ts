export type ISettingsListRow = {
  label: string
  value?: string | boolean
  onPress?: () => void
  onValueChange?: (value: boolean) => void
  isWarning?: boolean
  isSwitch?: boolean
  disabled?: boolean
}
