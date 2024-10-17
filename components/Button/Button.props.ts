import {
  GestureResponderEvent,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";

import { IPicto } from "../Picto/Picto";

export type IButtonProps = {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant: "primary" | "secondary" | "secondary-danger" | "grey" | "text";
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  allowFontScaling?: boolean;
  picto?: IPicto;
  numberOfLines?: number;
  hitSlop?: number;
  loading?: boolean;
};
