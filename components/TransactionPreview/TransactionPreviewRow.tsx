import { HStack } from "@design-system/HStack";
import { Text } from "@design-system/Text";
import { TouchableOpacity } from "@design-system/TouchableOpacity";
import { VStack } from "@design-system/VStack";
import { spacing } from "@theme/spacing";
import { ThemedStyle, useAppTheme } from "@theme/useAppTheme";

import { Image, ImageSource } from "expo-image";
import { memo } from "react";
import { StyleSheet, TextStyle } from "react-native";

import Picto from "../Picto/Picto";

type ITransactionPreviewRowProps = {
  title: string;
  subtitle: string;
  imageSrc?: ImageSource | undefined;
  imagePlaceholder?: ImageSource | undefined;
  onPress?: () => void;
};

export const TransactionPreviewRow = memo(
  (props: ITransactionPreviewRowProps) => {
    const { themed } = useAppTheme();
    return (
      <TouchableOpacity
        activeOpacity={props.onPress ? 0.5 : 1}
        onPress={props.onPress}
      >
        <HStack style={styles.row}>
          <Image
            source={props.imageSrc}
            placeholder={props.imagePlaceholder}
            style={styles.leftImage}
          />
          <VStack>
            <Text size="sm" style={themed($title)}>
              {props.title}
            </Text>
            <Text>{props.subtitle}</Text>
          </VStack>
          {props.onPress && (
            <Picto picto="chevron.right" style={styles.picto} />
          )}
        </HStack>
      </TouchableOpacity>
    );
  }
);

const $title: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text.secondary,
});

const styles = StyleSheet.create({
  row: { alignItems: "center", paddingBottom: spacing.sm },
  leftImage: {
    width: 40,
    height: 40,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  picto: {
    marginLeft: "auto",
    marginRight: spacing.xs,
  },
});
