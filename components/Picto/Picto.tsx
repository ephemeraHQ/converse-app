import {
  ColorValue,
  Platform,
  PlatformColor,
  StyleProp,
  ViewStyle,
} from "react-native";
import { SFSymbol } from "react-native-sfsymbols";

type Props = {
  picto: string;
  style?: StyleProp<ViewStyle>;
  color?: ColorValue;
  size?: number;
  weight?: string;
};

export default function Picto({ picto, style, size, weight, color }: Props) {
  return (
    <SFSymbol
      name={picto}
      weight={(weight as any) || "regular"}
      scale="large"
      color={
        color || Platform.OS === "ios" ? PlatformColor("systemBlue") : "blue"
      }
      size={size}
      multicolor={false}
      resizeMode="center"
      style={style}
    />
  );
}
