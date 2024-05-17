import { Image, ImageStyle } from "expo-image";
import { StyleProp } from "react-native";

import PFPPlaceholderColor from "../assets/default-pfp-color.png";
import PFPPlaceholder from "../assets/default-pfp-light.png";

type Props = {
  uri?: string | undefined;
  size?: number | undefined;
  style?: StyleProp<ImageStyle>;
  color?: boolean;
};
export default function Avatar({ uri, size, style, color }: Props) {
  return (
    <Image
      key={uri}
      source={{ uri }}
      placeholder={color ? PFPPlaceholderColor : PFPPlaceholder}
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
