import * as React from "react";
import { useWindowDimensions } from "react-native";
import {
  KeyboardProps,
  ContextValues,
  KeyboardContext,
  defaultKeyboardContext,
  defaultKeyboardValues,
  defaultTheme,
  emptyStyles,
} from "./KeyboardContext";
import { useKeyboardStore } from "../store/useKeyboardStore";
import type {
  CategoryTypes,
  EmojisByCategory,
  JsonEmoji,
  EmojiTonesData,
} from "../types";
import {
  skinTones,
  generateToneSelectorFunnelPosition,
  generateToneSelectorPosition,
  insertAtCertainIndex,
  variantSelector,
  zeroWidthJoiner,
} from "../utils/skinToneSelectorUtils";
import { deepMerge } from "../utils/deepMerge";

type ProviderProps = Partial<KeyboardProps> &
  Pick<KeyboardProps, "onEmojiSelected"> & {
    children: React.ReactNode;
  };

export const KeyboardProvider: React.FC<ProviderProps> = React.memo((props) => {
  const { width } = useWindowDimensions();
  const [activeCategoryIndex, _setActiveCategoryIndex] = React.useState(0);
  const setActiveCategoryIndex = (index: number) => {
    _setActiveCategoryIndex(index);
  };
  const [shouldAnimateScroll, setShouldAnimateScroll] = React.useState(true);
  const [searchPhrase, setSearchPhrase] = React.useState("");
  const { keyboardState } = useKeyboardStore();

  const [emojiTonesData, setEmojiTonesData] =
    React.useState<EmojiTonesData>(null);

  const numberOfColumns = React.useRef<number>(
    Math.floor(
      width /
        ((props.emojiSize
          ? props.emojiSize
          : defaultKeyboardContext.emojiSize) *
          2)
    )
  );

  const generateEmojiTones = React.useCallback(
    (emoji: JsonEmoji, emojiIndex: number, emojiSizes: any) => {
      if (!emoji || !emoji.toneEnabled) return;

      const EXTRA_SEARCH_TOP =
        props.enableSearchBar || props.categoryPosition === "top" ? 50 : 0;

      const splittedEmoji = emoji.emoji.split("");
      const ZWJIndex = splittedEmoji.findIndex((a) => a === zeroWidthJoiner);
      const selectorIndex = splittedEmoji.findIndex(
        (a) => a === variantSelector
      );
      const modifiedEmojis = skinTones.map((tone) => {
        const basicEmojiData = {
          index: tone.name,
          name: emoji.name,
          v: emoji.v,
          toneEnabled: true,
        };
        // Check for emojis special signs which might break tone modify
        switch (true) {
          case ZWJIndex > 0:
            return {
              ...basicEmojiData,
              emoji: insertAtCertainIndex(
                splittedEmoji,
                ZWJIndex,
                tone.color
              ).join(""),
            };
          case selectorIndex > 0:
            return {
              ...basicEmojiData,
              emoji: insertAtCertainIndex(
                splittedEmoji,
                selectorIndex,
                tone.color
              ).join(""),
            };
          default:
            return {
              ...basicEmojiData,
              emoji: emoji.emoji + tone.color,
            };
        }
      });

      const skinTonePosition = generateToneSelectorPosition(
        numberOfColumns.current,
        emojiIndex,
        width,
        emojiSizes.width,
        emojiSizes.height,
        EXTRA_SEARCH_TOP
      );

      const funnelXPosition = generateToneSelectorFunnelPosition(
        numberOfColumns.current,
        emojiIndex,
        emojiSizes.width
      );

      setEmojiTonesData({
        emojis: modifiedEmojis,
        position: skinTonePosition,
        funnelXPosition,
      });
    },
    [props.categoryPosition, props.enableSearchBar, width]
  );

  const clearEmojiTonesData = () => setEmojiTonesData(null);

  React.useEffect(() => {
    clearEmojiTonesData();
  }, [activeCategoryIndex]);

  React.useEffect(() => {
    if (props.open) setActiveCategoryIndex(0);
    setSearchPhrase("");
    clearEmojiTonesData();
  }, [props.open]);

  const renderList = React.useMemo(() => {
    const emojisByCategory =
      props.emojisByCategory || defaultKeyboardContext.emojisByCategory;
    let data = emojisByCategory.filter((category) => {
      const title = category.title as CategoryTypes;
      if (props.disabledCategories)
        return !props.disabledCategories.includes(title);
      return true;
    });
    if (keyboardState.recentlyUsed.length && props.enableRecentlyUsed) {
      data.push({
        title: "recently_used" as CategoryTypes,
        data: keyboardState.recentlyUsed,
      });
    }
    if (props.enableSearchBar) {
      data.push({
        title: "search" as CategoryTypes,
        data: emojisByCategory
          .map((group) => group.data)
          .flat()
          .filter((emoji) => {
            if (searchPhrase.length < 2) return false;

            const isInKeywords =
              emoji?.keywords &&
              emoji.keywords.length > 0 &&
              emoji.keywords.some((keyword) =>
                keyword.toLowerCase().includes(searchPhrase.toLowerCase())
              );

            return (
              emoji.name.toLowerCase().includes(searchPhrase.toLowerCase()) ||
              emoji.emoji.toLowerCase().includes(searchPhrase) ||
              isInKeywords
            );
          }),
      });
    }
    if (props.categoryOrder) {
      const orderedData = props.categoryOrder.flatMap((name) =>
        data.filter((el) => el.title === name)
      );
      const restData = data.filter(
        (el) => !props?.categoryOrder?.includes(el.title as CategoryTypes)
      );
      data = [...orderedData, ...restData];
    }
    return data as EmojisByCategory[];
  }, [
    keyboardState.recentlyUsed,
    props.enableRecentlyUsed,
    props.enableSearchBar,
    props.categoryOrder,
    props.disabledCategories,
    props.emojisByCategory,
    searchPhrase,
  ]);

  const value: typeof defaultKeyboardContext & ContextValues = React.useMemo(
    () => ({
      ...defaultKeyboardContext,
      ...defaultKeyboardValues,
      ...props,
      theme: props.theme ? deepMerge(defaultTheme, props.theme) : defaultTheme,
      styles: props.styles ? deepMerge(emptyStyles, props.styles) : emptyStyles,
      activeCategoryIndex,
      setActiveCategoryIndex,
      numberOfColumns: numberOfColumns.current,
      width,
      searchPhrase,
      setSearchPhrase,
      renderList,
      clearEmojiTonesData,
      generateEmojiTones,
      emojiTonesData,
      shouldAnimateScroll,
      setShouldAnimateScroll,
    }),
    [
      activeCategoryIndex,
      emojiTonesData,
      generateEmojiTones,
      props,
      renderList,
      searchPhrase,
      shouldAnimateScroll,
      width,
    ]
  );
  return (
    <KeyboardContext.Provider value={value}>
      {props.children}
    </KeyboardContext.Provider>
  );
});

KeyboardProvider.displayName = "KeyboardProvider";
