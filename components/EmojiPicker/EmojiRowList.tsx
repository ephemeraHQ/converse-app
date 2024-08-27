import { ListRenderItem as FlashListRenderItem } from "@shopify/flash-list";
import { ReanimatedView, ReanimatedFlashList } from "@utils/animations";
import { CategorizedEmojisRecord } from "@utils/emojis/interfaces";
import React, { FC, useCallback } from "react";
import { ListRenderItem, Platform, useWindowDimensions } from "react-native";
import { FlatList } from "react-native-gesture-handler";

import { EmojiRow } from "./EmojiRow";

interface EmojiRowListProps {
  emojis: CategorizedEmojisRecord[];
  ListHeader?: React.ReactNode;
  onPress: (emoji: string) => void;
}

const keyExtractor = (_: unknown, index: number) => String(index);

export const EmojiRowList: FC<EmojiRowListProps> = ({
  emojis,
  ListHeader,
  onPress,
}) => {
  const { height: windowHeight } = useWindowDimensions();
  const height = Math.min(emojis.length * 50, windowHeight * 0.75);

  const renderItem: ListRenderItem<CategorizedEmojisRecord> &
    FlashListRenderItem<CategorizedEmojisRecord> = useCallback(
    ({ item }) => <EmojiRow onPress={onPress} item={item} />,
    [onPress]
  );

  // Works around issue with Android not picking up scrolls
  const ListRenderer = Platform.OS === "ios" ? ReanimatedFlashList : FlatList;

  return (
    <ReanimatedView style={{ height, overflow: "hidden" }}>
      <ListRenderer
        ListHeaderComponent={() => ListHeader}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={50}
        data={emojis}
        scrollEnabled={emojis.length > 1}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
      />
    </ReanimatedView>
  );
};
