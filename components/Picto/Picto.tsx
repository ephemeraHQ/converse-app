import {
  ColorValue,
  Platform,
  PlatformColor,
  StyleProp,
  useColorScheme,
  ViewStyle,
} from "react-native";
import { SFSymbol } from "react-native-sfsymbols";

import { textSecondaryColor } from "../../utils/colors";

type Props = {
  picto: string;
  style?: StyleProp<ViewStyle>;
  color?: ColorValue;
  size?: number;
  weight?: string;
};

export default function Picto({ picto, style, size, weight, color }: Props) {
  const colorScheme = useColorScheme();
  const defaultColor =
    Platform.OS === "ios"
      ? PlatformColor("systemBlue")
      : textSecondaryColor(colorScheme);
  return (
    <SFSymbol
      name={picto}
      weight={(weight as any) || "regular"}
      scale="large"
      color={color || defaultColor}
      size={size}
      multicolor={false}
      resizeMode="center"
      style={style}
    />
  );
}
