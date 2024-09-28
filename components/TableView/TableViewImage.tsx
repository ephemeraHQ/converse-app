import { textSecondaryColor } from "@styles/colors";
import { PictoSizes } from "@styles/sizes";
import { Image } from "expo-image";
import React from "react";
import {
  ColorValue,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  useColorScheme,
} from "react-native";

import IconLoading from "../../assets/icon-loading.png";
import Picto from "../Picto/Picto";
import SvgImageUri from "../SvgImageUri";

const IMAGE_SIZE = Platform.OS === "android" ? 24 : 30;

export const TableViewImage = ({ imageURI }: { imageURI?: string }) => {
  const imageStyle = {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: IMAGE_SIZE,
    marginLeft: Platform.OS === "ios" ? 0 : 16,
  };
  return (
    <View style={staticStyles.imageContainer}>
      {imageURI?.endsWith(".svg") ? (
        <SvgImageUri
          uri={imageURI}
          width={IMAGE_SIZE}
          height={IMAGE_SIZE}
          style={imageStyle}
          defaultSource={IconLoading}
        />
      ) : (
        <Image
          source={{ uri: imageURI }}
          style={imageStyle}
          placeholder={IconLoading}
        />
      )}
    </View>
  );
};

export const TableViewPicto = ({
  symbol,
  color,
  onPress,
}: {
  symbol: string;
  color?: ColorValue;
  onPress?: () => void;
}) => {
  const colorScheme = useColorScheme();
  const pictoView = (
    <View style={staticStyles.imageContainer}>
      <Picto
        picto={symbol}
        size={PictoSizes.tableViewImage}
        style={Platform.select({
          default: {
            width: IMAGE_SIZE,
            height: IMAGE_SIZE,
            marginLeft: Platform.OS === "ios" ? 0 : 16,
          },
        })}
        color={
          color ||
          (Platform.OS === "ios" ? undefined : textSecondaryColor(colorScheme))
        }
      />
    </View>
  );
  if (!onPress) return pictoView;
  return <TouchableOpacity onPress={onPress}>{pictoView}</TouchableOpacity>;
};

export const TableViewEmoji = ({
  emoji,
  style,
}: {
  emoji: string;
  style?: StyleProp<ViewStyle>;
}) => {
  return (
    <View style={[staticStyles.emojiContainer, style]}>
      <Text>{emoji}</Text>
    </View>
  );
};

const staticStyles = StyleSheet.create({
  imageContainer: {
    justifyContent: "center",
  },
  emojiContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: Platform.OS === "android" ? 16 : 0,
  },
});
