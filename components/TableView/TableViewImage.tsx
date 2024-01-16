import { Image } from "expo-image";
import React from "react";
import {
  ColorValue,
  Platform,
  StyleProp,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  useColorScheme,
} from "react-native";

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
    marginLeft: Platform.OS === "ios" ? 0 : 16,
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
    <View style={{ justifyContent: "center" }}>
      <Picto
        picto={symbol}
        size={Platform.OS === "ios" ? 16 : 24}
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
