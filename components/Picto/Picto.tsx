import { ColorValue, StyleProp, useColorScheme, ViewStyle } from "react-native";
import { SFSymbol } from "react-native-sfsymbols";

import { primaryColor } from "../../utils/colors";

type Props = {
  picto: string;
  style?: StyleProp<ViewStyle>;
  color?: ColorValue;
  size?: number;
  weight?: string;
};

export default function Picto({ picto, style, size, weight, color }: Props) {
  const colorScheme = useColorScheme();
  return (
    <SFSymbol
      name={picto}
      weight={(weight as any) || "regular"}
      scale="large"
      color={color || primaryColor(colorScheme)}
      size={size}
      multicolor={false}
      resizeMode="center"
      style={style}
    />
  );
}
