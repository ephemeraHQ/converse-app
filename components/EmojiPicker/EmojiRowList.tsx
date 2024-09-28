import { ListRenderItem as FlashListRenderItem } from "@shopify/flash-list";
import { ReanimatedView, ReanimatedFlashList } from "@utils/animations";
import { CategorizedEmojisRecord } from "@utils/emojis/interfaces";
import React, { FC, useCallback, useEffect } from "react";
import {
  ListRenderItem,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { FlatList } from "react-native-gesture-handler";
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmojiRow } from "./EmojiRow";

interface EmojiRowListProps {
  emojis: CategorizedEmojisRecord[];
  ListHeader?: React.ReactNode;
  onPress: (emoji: string) => void;
}

const keyExtractor = (_: unknown, index: number) => String(index);

// Works around issue with Android not picking up scrolls
const ListRenderer = Platform.OS === "ios" ? ReanimatedFlashList : FlatList;

export const EmojiRowList: FC<EmojiRowListProps> = ({
  emojis,
  ListHeader,
  onPress,
}) => {
  const styles = useStyles();
  const { height: windowHeight } = useWindowDimensions();
  const height = useSharedValue(
    Math.min(emojis.length * 50, windowHeight * 0.75)
  );

  useEffect(() => {
    height.value = withTiming(
      Math.min(emojis.length * 50, windowHeight * 0.75),
      {
        duration: 400,
      }
    );
  }, [emojis.length, height, windowHeight]);

  const renderItem: ListRenderItem<CategorizedEmojisRecord> &
    FlashListRenderItem<CategorizedEmojisRecord> = useCallback(
    ({ item }) => <EmojiRow onPress={onPress} item={item} />,
    [onPress]
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: height.value,
    };
  });

  return (
    <ReanimatedView style={[animatedStyle, styles.container]}>
      <ListRenderer
        ListHeaderComponent={() => ListHeader}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={50}
        data={emojis}
        scrollEnabled={emojis.length > 1}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={() => <View style={styles.bottom} />}
      />
    </ReanimatedView>
  );
};

const useStyles = () => {
  const insets = useSafeAreaInsets();

  return StyleSheet.create({
    container: {
      overflow: "hidden",
    },
    bottom: {
      height: insets.bottom,
    },
  });
};
