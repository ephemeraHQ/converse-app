import { ColorValue, StyleProp, Text, ViewStyle } from "react-native";

type Props = {
  picto: string;
  style?: StyleProp<ViewStyle>;
  color?: ColorValue;
  size?: number;
  weight?: string;
};

export default function Picto({ picto, style, size, weight, color }: Props) {
  return <Text>•</Text>;
}
