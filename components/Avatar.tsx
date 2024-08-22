import { actionSecondaryColor, textSecondaryColor } from "@styles/colors";
import { AvatarSizes } from "@styles/sizes";
import { getFirstLetterForAvatar } from "@utils/getFirstLetterForAvatar";
import { ImageBackground } from "expo-image";
import React, { useCallback, useState } from "react";
import {
  ColorSchemeName,
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import { Indicator } from "./Indicator";

type Props = {
  uri?: string | undefined;
  size?: number | undefined;
  style?: StyleProp<ImageStyle>;
  color?: boolean;
  name?: string | undefined;
  showIndicator?: boolean;
};

function Avatar({
  uri,
  size = AvatarSizes.default,
  style,
  color,
  name,
  showIndicator,
}: Props) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme, size);
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
      >
        {showIndicator && <Indicator size={size} />}
      </ImageBackground>
    </>
  ) : (
    <View
      style={StyleSheet.flatten([
        styles.placeholder,
        style,
        { width: size, height: size, borderRadius: size / 2 },
      ])}
    >
      <Text style={styles.text}>{firstLetter}</Text>
      {showIndicator && <Indicator size={size} />}
    </View>
  );
}

const getStyles = (colorScheme: ColorSchemeName, size: number) =>
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

export default React.memo(Avatar);
