import React from "react";
import { Platform, Text, View, useColorScheme } from "react-native";

import { textSecondaryColor } from "../../utils/colors";
import Picto from "../Picto/Picto";

export const TableViewPicto = ({ symbol }: { symbol: string }) => {
  const colorScheme = useColorScheme();
  return (
    <Picto
      picto={symbol}
      size={Platform.OS === "android" ? 24 : 16}
      style={Platform.select({
        default: { width: 30, height: 30, marginRight: 8 },
        // android: { marginLeft: 8 },
      })}
      color={
        Platform.OS === "android" ? textSecondaryColor(colorScheme) : undefined
      }
    />
  );
};

export const TableViewEmoji = ({ emoji }: { emoji: string }) => {
  return (
    <View
      style={{
        width: 30,
        height: 30,
        marginRight: 8,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>{emoji}</Text>
    </View>
  );
};
