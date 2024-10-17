import { actionSecondaryColor, textSecondaryColor } from "@styles/colors";
import { AvatarSizes } from "@styles/sizes";
import { getFirstLetterForAvatar } from "@utils/getFirstLetterForAvatar";
import { ImageBackground } from "expo-image";
import React, { useCallback, useState } from "react";
import {
  ColorSchemeName,
  ImageStyle,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import { Indicator } from "./Indicator";
import Picto from "./Picto/Picto";

export type AvatarProps = {
  uri?: string | undefined;
  size?: number | undefined;
  style?: StyleProp<ImageStyle>;
  color?: boolean;
  name?: string | undefined;
  showIndicator?: boolean;
  // Inverts the color of the place holder
  invertColor?: boolean;
};

function Avatar({
  uri,
  size = AvatarSizes.default,
  style,
  color,
  name,
  showIndicator,
  invertColor,
}: AvatarProps) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme, size, invertColor || false);
  const firstLetter = getFirstLetterForAvatar(name || "");
  const [didError, setDidError] = useState(false);

  const handleImageError = useCallback(() => {
    setDidError(true);
  }, []);

  const handleImageLoad = useCallback(() => {
    setDidError(false);
  }, []);
  return uri && !didError ? (
    <>
      <ImageBackground
        onLoad={handleImageLoad}
        onError={handleImageError}
        key={`${uri}-${color}-${colorScheme}`}
        source={{ uri }}
        style={[styles.imageContainer, style]}
        imageStyle={styles.image}
        cachePolicy="memory-disk"
        testID="avatar-image"
      >
        {showIndicator && <Indicator size={size} testID="avatar-indicator" />}
      </ImageBackground>
    </>
  ) : (
    <View
      style={StyleSheet.flatten([
        styles.placeholder,
        style,
        { width: size, height: size, borderRadius: size / 2 },
      ])}
      testID="avatar-placeholder"
    >
      {name ? (
        <Text style={styles.text}>{firstLetter}</Text>
      ) : (
        <Picto
          picto="photo"
          size={Platform.OS === "ios" ? size / 3 : size / 2}
          color="white"
        />
      )}
      {showIndicator && (
        <Indicator size={size} testID="avatar-placeholder-indicator" />
      )}
    </View>
  );
}

const getStyles = (
  colorScheme: ColorSchemeName,
  size: number,
  invertColor: boolean
) =>
  StyleSheet.create({
    image: {
      borderRadius: size,
    },
    imageContainer: {
      width: size,
      height: size,
    },
    placeholder: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor:
        colorScheme === "dark"
          ? invertColor
            ? actionSecondaryColor("light")
            : textSecondaryColor(colorScheme)
          : invertColor
          ? textSecondaryColor("dark")
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

export default React.memo(Avatar);
