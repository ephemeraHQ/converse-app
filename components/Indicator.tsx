import { backgroundColor, badgeColor } from "@styles/colors";
import React, { memo } from "react";
import {
  useColorScheme,
  ColorSchemeName,
  StyleSheet,
  View,
} from "react-native";

const IndicatorInner = ({
  size,
  testID,
}: {
  size: number;
  testID?: string;
}) => {
  const styles = getStyles(useColorScheme(), size);

  return (
    <View style={styles.indicator} testID={testID}>
      <View style={styles.indicatorInner} />
    </View>
  );
};

export const Indicator = memo(IndicatorInner);

const getStyles = (colorScheme: ColorSchemeName, size: number) =>
  StyleSheet.create({
    indicator: {
      height: size / 5,
      width: size / 5,
      backgroundColor: backgroundColor(colorScheme),
      alignItems: "center",
      justifyContent: "center",
      borderRadius: size / 5,
    },
    indicatorInner: {
      height: size / 5 - 4,
      width: size / 5 - 4,
      backgroundColor: badgeColor(colorScheme),
      borderRadius: size / 5,
    },
  });
