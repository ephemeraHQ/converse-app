import {
  Image,
  ImageStyle,
  Text,
  View,
  StyleSheet,
  StyleProp,
  useColorScheme,
  ColorSchemeName,
} from "react-native";

import { actionSecondaryColor, textSecondaryColor } from "../utils/colors";

type Props = {
  uri?: string | undefined;
  size?: number | undefined;
  style?: StyleProp<ImageStyle>;
  color?: boolean;
  name?: string | undefined;
};

export default function Avatar({ uri, size = 121, style, color, name }: Props) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme, size);
  const firstLetter = name ? name.charAt(0).toUpperCase() : "";

  return uri ? (
    <Image
      key={`${uri}-${color}-${colorScheme}`}
      source={{ uri }}
      style={[styles.image, style]}
    />
  ) : (
    <View style={[styles.placeholder, style]}>
      <Text style={styles.text}>{firstLetter}</Text>
    </View>
  );
}

const getStyles = (colorScheme: ColorSchemeName, size: number) =>
  StyleSheet.create({
    image: {
      width: size,
      height: size,
      borderRadius: size,
    },
    placeholder: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor:
        colorScheme === "dark"
          ? textSecondaryColor(colorScheme)
          : actionSecondaryColor(colorScheme),
      justifyContent: "center",
      alignItems: "center",
    },
    text: {
      fontSize: size / 2,
      fontWeight: "500",
      color: "white",
      textAlign: "center",
    },
  });
