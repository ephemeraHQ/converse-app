import { Image, ImageStyle } from "expo-image";
import { StyleProp, useColorScheme } from "react-native";

import PFPPlaceholderColor from "../assets/default-pfp-color.png";
import PFPPlaceholderDark from "../assets/default-pfp-dark.png";
import PFPPlaceholderLight from "../assets/default-pfp-light.png";

type Props = {
  uri?: string | undefined;
  size?: number | undefined;
  style?: StyleProp<ImageStyle>;
  color?: boolean;
};
export default function Avatar({ uri, size, style, color }: Props) {
  const colorScheme = useColorScheme();
  const PFPPlaceholder = color
    ? PFPPlaceholderColor
    : colorScheme === "dark"
    ? PFPPlaceholderDark
    : PFPPlaceholderLight;
  return (
    <Image
      key={`${uri}-${color}-${colorScheme}`}
      source={{ uri }}
      placeholder={PFPPlaceholder}
      placeholderContentFit="cover"
      contentFit="cover"
      style={[
        {
          width: size || 121,
          height: size || 121,
          borderRadius: size || 121,
        },
        style,
      ]}
    />
  );
}
