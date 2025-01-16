export type ITableRow = {
  label: string;
  value?: string;
  onValueChange?: (value: boolean) => void;
  isSwitch?: boolean;
  isEnabled?: boolean;
  isWarning?: boolean;
  onPress?: () => void;
};
