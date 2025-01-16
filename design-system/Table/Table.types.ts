export type ITableRow = {
  label: string;
  value?: string | number;
  onValueChange?: (value: boolean) => void;
  isSwitch?: boolean;
  isWarning?: boolean;
  disabled?: boolean;
  onPress?: () => void;
};
