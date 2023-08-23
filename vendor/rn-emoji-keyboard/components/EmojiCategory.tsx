import * as React from "react";

import { StyleSheet, View, Text } from "react-native";
import type { EmojisByCategory, EmojiSizes, JsonEmoji } from "../types";
import { SingleEmoji } from "./SingleEmoji";
import { KeyboardContext } from "../contexts/KeyboardContext";
import { useKeyboardStore } from "../store/useKeyboardStore";
import { parseEmoji } from "../utils/parseEmoji";
import { removeSkinToneModifier } from "../utils/skinToneSelectorUtils";
import { FlashList } from "@shopify/flash-list";

const emptyEmoji: JsonEmoji = {
  emoji: "",
  name: "blank emoji",
  v: "0",
  toneEnabled: false,
};

export const EmojiCategory = React.memo(
  ({
    item: { title, data },
    setKeyboardScrollOffsetY,
  }: {
    item: EmojisByCategory;
    setKeyboardScrollOffsetY: (y: number) => void;
  }) => {
    const {
      onEmojiSelected,
      emojiSize,
      numberOfColumns,
      width,
      hideHeader,
      translation,
      categoryPosition,
      clearEmojiTonesData,
      generateEmojiTones,
      theme,
      styles: themeStyles,
      selectedEmojis,
    } = React.useContext(KeyboardContext);

    const { setKeyboardState, keyboardState } = useKeyboardStore();

    const [empty, setEmpty] = React.useState<JsonEmoji[]>([]);

    React.useEffect(() => {
      if (data.length % numberOfColumns) {
        const fillWithEmpty = new Array(
          numberOfColumns - (data.length % numberOfColumns)
        ).fill(emptyEmoji);
        setEmpty(fillWithEmpty);
      }
    }, [numberOfColumns, data]);

    // const getItemLayout = React.useCallback(
    //   (_: ArrayLike<JsonEmoji> | null | undefined, index: number) => ({
    //     length: emojiSize ? emojiSize : 0,
    //     offset: emojiSize * Math.ceil(index / numberOfColumns),
    //     index,
    //   }),
    //   [emojiSize, numberOfColumns]
    // );

    const handleEmojiPress = React.useCallback(
      (emoji: JsonEmoji) => {
        if (emoji.name === "blank emoji") return;
        clearEmojiTonesData();
        const parsedEmoji = parseEmoji(emoji);
        setKeyboardState({ type: "RECENT_EMOJI_ADD", payload: emoji });
        if (Array.isArray(selectedEmojis))
          return onEmojiSelected({
            ...parsedEmoji,
            alreadySelected: selectedEmojis.includes(emoji.name),
          });
        onEmojiSelected(parsedEmoji);
      },
      [selectedEmojis, onEmojiSelected, setKeyboardState, clearEmojiTonesData]
    );

    const handleEmojiLongPress = React.useCallback(
      (emoji: JsonEmoji, emojiIndex: number, emojiSizes: EmojiSizes) => {
        clearEmojiTonesData();

        const emojiWithoutTone = {
          ...emoji,
          emoji: removeSkinToneModifier(emoji.emoji),
        };

        generateEmojiTones(emojiWithoutTone, emojiIndex, emojiSizes);
      },
      [clearEmojiTonesData, generateEmojiTones]
    );

    const renderItem = React.useCallback(
      ({ item, index }: { item: JsonEmoji; index: number }) => {
        const recentlyUsed = keyboardState?.recentlyUsed || [];
        const recentlyUsedEmoji = recentlyUsed?.find(
          (emoji) => emoji.name === item.name
        );

        const isSelected = selectedEmojis && selectedEmojis.includes(item.name);

        return (
          <SingleEmoji
            index={index}
            isSelected={isSelected}
            item={recentlyUsedEmoji || item}
            emojiSize={emojiSize}
            onPress={handleEmojiPress}
            onLongPress={handleEmojiLongPress}
            selectedEmojiStyle={
              isSelected
                ? [
                    styles.selectedEmoji,
                    { backgroundColor: theme.emoji.selected },
                    themeStyles.emoji.selected,
                  ]
                : {}
            }
          />
        );
      },
      [
        keyboardState?.recentlyUsed,
        selectedEmojis,
        emojiSize,
        handleEmojiPress,
        handleEmojiLongPress,
        theme.emoji.selected,
        themeStyles.emoji.selected,
      ]
    );
    // const handleOnScroll = (ev: {
    //   nativeEvent: { contentOffset: { y: number } };
    // }) => {
    //   // setKeyboardScrollOffsetY(ev.nativeEvent.contentOffset.y);
    //   clearEmojiTonesData();
    // };
    // const keyExtractor = React.useCallback(
    //   (item: JsonEmoji) =>
    //     `${item.emoji}-${item.name}-${item.toneEnabled}-${item.v}`,
    //   []
    // );

    return (
      <View style={[styles.container, { width }]}>
        {!hideHeader && (
          <Text
            style={[
              styles.sectionTitle,
              themeStyles.header,
              { color: theme.header },
            ]}
          >
            {translation[title]}
          </Text>
        )}
        <View style={{ flex: 1 }}>
          <FlashList
            data={[...data, ...empty]}
            // keyExtractor={keyExtractor}
            numColumns={numberOfColumns}
            renderItem={renderItem}
            estimatedItemSize={emojiSize}
            // getItemLayout={getItemLayout}
            // onScroll={handleOnScroll}
            ListFooterComponent={() => (
              <View
                style={
                  categoryPosition === "floating"
                    ? styles.footerFloating
                    : styles.footer
                }
              />
            )}
            // initialNumToRender={10}
            // windowSize={16}
            // maxToRenderPerBatch={5}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      </View>
    );
  },
  (prevProps, nextProps) => {
    if (nextProps.item.title !== "search") return true;
    if (prevProps.item.data.length !== nextProps.item.data.length) return false;
    return (
      prevProps.item.data.map((d) => d.name).join() ===
      nextProps.item.data.map((d) => d.name).join()
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
    marginTop: 6,
  },
  sectionTitle: {
    marginTop: 12,
    marginBottom: 6,
    marginLeft: 12,
  },
  footer: { height: 8 },
  footerFloating: { height: 70 },
  selectedEmoji: { borderRadius: 25 },
});
