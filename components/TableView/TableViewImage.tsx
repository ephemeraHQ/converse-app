import React from "react";
import {
  ColorValue,
  Platform,
  StyleProp,
  Text,
  View,
  ViewStyle,
  useColorScheme,
} from "react-native";
import FastImage from "react-native-fast-image";

import IconLoading from "../../assets/icon-loading.png";
import { textSecondaryColor } from "../../utils/colors";
import Picto from "../Picto/Picto";
import SvgImageUri from "../SvgImageUri";

const IMAGE_SIZE = Platform.OS === "android" ? 24 : 30;

export const TableViewImage = ({ imageURI }: { imageURI?: string }) => {
  const imageStyle = {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: IMAGE_SIZE,
    marginLeft: Platform.OS === "android" ? 16 : 0,
  };
  return (
    <View style={{ justifyContent: "center" }}>
      {imageURI?.endsWith(".svg") ? (
        <SvgImageUri
          uri={imageURI}
          width={IMAGE_SIZE}
          height={IMAGE_SIZE}
          style={imageStyle}
          defaultSource={IconLoading}
        />
      ) : (
        <FastImage
          source={{ uri: imageURI }}
          style={imageStyle}
          defaultSource={IconLoading}
        />
      )}
    </View>
  );
};

export const TableViewPicto = ({
  symbol,
  color,
}: {
  symbol: string;
  color?: ColorValue;
}) => {
  const colorScheme = useColorScheme();
  return (
    <View style={{ justifyContent: "center" }}>
      <Picto
        picto={symbol}
        size={Platform.OS === "android" ? 24 : 16}
        style={Platform.select({
          default: {
            width: IMAGE_SIZE,
            height: IMAGE_SIZE,
            marginLeft: Platform.OS === "android" ? 16 : 0,
          },
        })}
        color={
          color ||
          (Platform.OS === "android"
            ? textSecondaryColor(colorScheme)
            : undefined)
        }
      />
    </View>
  );
};

export const TableViewEmoji = ({
  emoji,
  style,
}: {
  emoji: string;
  style?: StyleProp<ViewStyle>;
}) => {
  return (
    <View
      style={[
        {
          width: IMAGE_SIZE,
          height: IMAGE_SIZE,
          justifyContent: "center",
          alignItems: "center",
          marginLeft: Platform.OS === "android" ? 16 : 0,
        },
        style,
      ]}
    >
      <Text>{emoji}</Text>
    </View>
  );
};
