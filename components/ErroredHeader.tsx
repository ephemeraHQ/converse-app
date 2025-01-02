import { dangerColor } from "@styles/colors";
import { PictoSizes } from "@styles/sizes";
import { FC } from "react";
import { StyleSheet, useColorScheme, View, ViewStyle } from "react-native";

import Picto from "./Picto/Picto";

type ErroredHeaderProps = {
  style?: ViewStyle;
};

export const ErroredHeader: FC<ErroredHeaderProps> = ({ style }) => {
  const colorScheme = useColorScheme();
  return (
    <View style={styles.container}>
      <Picto
        picto="exclamationmark.triangle"
        color={dangerColor(colorScheme)}
        size={PictoSizes.textButton}
        style={[styles.picto, style]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  picto: {
    width: PictoSizes.textButton,
    height: PictoSizes.textButton,
    marginLeft: 5,
    marginTop: -6,
  },
  container: {
    justifyContent: "center",
  },
});
