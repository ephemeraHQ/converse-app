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

export const TableViewImage = ({ imageURI }: { imageURI?: string }) => {
  return (
    <FastImage
      source={{ uri: imageURI }}
      style={{ width: 30, height: 30, borderRadius: 30 }}
      defaultSource={IconLoading}
    />
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
    <Picto
      picto={symbol}
      size={Platform.OS === "android" ? 24 : 16}
      style={Platform.select({
        default: { width: 30, height: 30 },
        // android: { marginLeft: 8 },
      })}
      color={
        color ||
        (Platform.OS === "android"
          ? textSecondaryColor(colorScheme)
          : undefined)
      }
    />
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
          width: 30,
          height: 30,
          justifyContent: "center",
          alignItems: "center",
        },
        style,
      ]}
    >
      <Text>{emoji}</Text>
    </View>
  );
};
