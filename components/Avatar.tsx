import { actionSecondaryColor, textSecondaryColor } from "@styles/colors";
import { AvatarSizes } from "@styles/sizes";
import { Image } from "expo-image";
import { useCallback, useState } from "react";
import {
  ColorSchemeName,
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

type Props = {
  uri?: string | undefined;
  size?: number | undefined;
  style?: StyleProp<ImageStyle>;
  color?: boolean;
  name?: string | undefined;
};

export default function Avatar({
  uri,
  size = AvatarSizes.default,
  style,
  color,
  name,
}: Props) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme, size);
  const firstLetter = name
    ? name.startsWith("0x")
      ? name.slice(0, 2)
      : name.charAt(0).toUpperCase()
    : "";
  const [didError, setDidError] = useState(false);

  const handleImageError = useCallback(() => {
    setDidError(true);
  }, []);

  const handleImageLoad = useCallback(() => {
    setDidError(false);
  }, []);

  return uri && !didError ? (
    <Image
      onLoad={handleImageLoad}
      onError={handleImageError}
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
