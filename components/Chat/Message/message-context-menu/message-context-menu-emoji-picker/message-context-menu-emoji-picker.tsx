import { EmojiRowList } from "@/components/Chat/Message/message-context-menu/message-context-menu-emoji-picker/message-context-menu-emoji-picker-list";
import { messageContextMenuEmojiPickerBottomSheetRef } from "@/components/Chat/Message/message-context-menu/message-context-menu-emoji-picker/message-context-menu-emoji-picker-utils";
import { BottomSheetContentContainer } from "@design-system/BottomSheet/BottomSheetContentContainer";
import { BottomSheetHeader } from "@design-system/BottomSheet/BottomSheetHeader";
import { BottomSheetModal } from "@design-system/BottomSheet/BottomSheetModal";
import { Text } from "@design-system/Text";
import { TextField } from "@design-system/TextField/TextField";
import { VStack } from "@design-system/VStack";
import { translate } from "@i18n";
import { ThemedStyle, useAppTheme } from "@theme/useAppTheme";
import { emojis } from "@utils/emojis/emojis";
import { CategorizedEmojisRecord, Emoji } from "@utils/emojis/interfaces";
import { matchSorter } from "match-sorter";
import { debounce } from "perfect-debounce";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { TextInput, TextStyle, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const flatEmojis = emojis.flatMap((category) => category.data);

const categorizedEmojis: CategorizedEmojisRecord[] = [];
emojis.forEach((category, index) => {
  for (let i = 0; i < category.data.length; i += 6) {
    const slicedEmojis = category.data.slice(i, i + 6).map((emoji) => emoji);
    categorizedEmojis.push({
      id: category.title + index,
      category: category.title,
      emojis: slicedEmojis,
    });
  }
});

const sliceEmojis = (emojis: Emoji[]) => {
  const slicedEmojis: CategorizedEmojisRecord[] = [];
  for (let i = 0; i < emojis.length; i += 6) {
    const sliced = emojis.slice(i, i + 6).map((emoji) => emoji);
    slicedEmojis.push({
      id: emojis[i].emoji,
      category: emojis[i].emoji,
      emojis: sliced,
    });
  }
  return slicedEmojis;
};

const filterEmojis = (text: string) => {
  const cleanedSearch = text.toLowerCase().trim();
  if (cleanedSearch.length === 0) {
    return sliceEmojis(flatEmojis);
  }
  return sliceEmojis(
    matchSorter(flatEmojis, cleanedSearch, {
      keys: ["keywords", "name", "emoji"],
    })
  );
};

const defaultEmojis = sliceEmojis(flatEmojis);

export const MessageContextMenuEmojiPicker = memo(
  function MessageContextMenuEmojiPicker({
    onSelectReaction,
  }: {
    onSelectReaction: (emoji: string) => void;
  }) {
    const textInputRef = useRef<TextInput>(null);

    const insets = useSafeAreaInsets();
    const { themed } = useAppTheme();

    const [filteredReactions, setFilteredReactions] = useState(defaultEmojis);
    const [hasInput, setHasInput] = useState(false);

    const closeMenu = useCallback(() => {
      textInputRef.current?.blur();
    }, []);

    const handleReaction = useCallback(
      (emoji: string) => {
        onSelectReaction(emoji);
        closeMenu();
      },
      [onSelectReaction, closeMenu]
    );

    const debouncedFilter = useMemo(
      () =>
        debounce((value: string) => {
          setFilteredReactions(filterEmojis(value));
          setHasInput(value.length > 0);
        }, 150),
      []
    );

    const onTextInputChange = useCallback(
      (value: string) => {
        debouncedFilter(value);
      },
      [debouncedFilter]
    );

    return (
      <BottomSheetModal
        onClose={closeMenu}
        ref={messageContextMenuEmojiPickerBottomSheetRef}
        topInset={insets.top}
        snapPoints={["50%", "100%"]}
      >
        <BottomSheetContentContainer>
          <BottomSheetHeader title={translate("choose_reaction")} hasClose />
          <TextField
            ref={textInputRef}
            onChangeText={onTextInputChange}
            placeholder={translate("search_emojis")}
            clearButtonMode="always"
            containerStyle={themed($inputContainer)}
          />
        </BottomSheetContentContainer>

        <VStack style={themed($container)}>
          {hasInput ? (
            <EmojiRowList emojis={filteredReactions} onPress={handleReaction} />
          ) : (
            <EmojiRowList
              emojis={categorizedEmojis}
              onPress={handleReaction}
              ListHeader={
                <Text preset="smaller" style={themed($headerText)}>
                  {translate("emoji_picker_all")}
                </Text>
              }
            />
          )}
        </VStack>
      </BottomSheetModal>
    );
  }
);

const $inputContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginVertical: spacing.xxs,
  marginHorizontal: spacing.xxs,
});

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginHorizontal: spacing.xxs,
});

const $headerText: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginLeft: spacing.sm,
});
